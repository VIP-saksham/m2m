from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models.user import User
from app.models.audit import AuditLog
from app.models.verification import VerificationRecord
from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand
from app.models.lot import ProcurementLot
from app.models.notification import Notification
from app import db
from datetime import datetime, date, timedelta

admin_bp = Blueprint('admin', __name__)


def _get_admin_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return None
    return user

@admin_bp.route('/notifications', methods=['POST'])
@jwt_required()
def send_notification():
    if not _get_admin_user():
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    message = (data.get('message') or '').strip()
    if not title or not message:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'Title and message are required'}}), 400
    user_id = data.get('user_id')
    query = User.query.filter_by(is_active=True)
    if user_id:
        query = query.filter_by(id=int(user_id))
    elif data.get('role'):
        query = query.filter_by(role=data['role'])
    recipients = query.all()
    if not recipients:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'No recipients found'}}), 404
    for recipient in recipients:
        db.session.add(Notification(user_id=recipient.id, type=data.get('type', 'info'), title=title, message=message))
    db.session.commit()
    return jsonify({'success': True, 'data': {'sent': len(recipients)}}), 201


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403

    total_users = User.query.count()
    verified_users = User.query.filter_by(verification_status='verified').count()
    unverified_users = User.query.filter_by(verification_status='unverified').count()
    farmers = User.query.filter_by(role='farmer').count()
    processors = User.query.filter(User.role.in_(['processor', 'buyer'])).count()
    total_batches = ProduceBatch.query.count()
    total_demands = ProcessorDemand.query.count()
    total_lots = ProcurementLot.query.count()
    confirmed_lots = ProcurementLot.query.filter_by(status='confirmed').count()

    # --- Aggregates for dashboard charts -------------------------------

    batches_by_quality = dict(
        db.session.query(ProduceBatch.initial_quality_estimate, func.count(ProduceBatch.id))
        .group_by(ProduceBatch.initial_quality_estimate)
        .all()
    )

    batches_by_status = dict(
        db.session.query(ProduceBatch.status, func.count(ProduceBatch.id))
        .group_by(ProduceBatch.status)
        .all()
    )

    batches_by_crop = (
        db.session.query(ProduceBatch.crop, func.count(ProduceBatch.id))
        .group_by(ProduceBatch.crop)
        .order_by(func.count(ProduceBatch.id).desc())
        .limit(5)
        .all()
    )

    # Audit events per day for the last 7 days (fills empty days with 0)
    today = date.today()
    week_start = today - timedelta(days=6)
    rows = (
        db.session.query(func.date(AuditLog.created_at), func.count(AuditLog.id))
        .filter(func.date(AuditLog.created_at) >= week_start)
        .group_by(func.date(AuditLog.created_at))
        .all()
    )
    counts_by_day = {str(d): c for d, c in rows}
    activity_trend = [
        {
            'date': (week_start + timedelta(days=i)).isoformat(),
            'label': (week_start + timedelta(days=i)).strftime('%a'),
            'count': counts_by_day.get((week_start + timedelta(days=i)).isoformat(), 0),
        }
        for i in range(7)
    ]

    recent_logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(8).all()
    actor_ids = {log.actor_id for log in recent_logs if log.actor_id}
    actor_names = {
        u.id: u.name for u in User.query.filter(User.id.in_(actor_ids)).all()
    } if actor_ids else {}
    recent_events = [
        {
            'id': a.id,
            'action': a.action,
            'entityType': a.entity_type,
            'entityId': a.entity_id,
            'actorName': actor_names.get(a.actor_id, 'System'),
            'createdAt': a.created_at.isoformat() if a.created_at else None,
        }
        for a in recent_logs
    ]

    return jsonify({
        'success': True,
        'data': {
            'totalUsers': total_users,
            'verifiedUsers': verified_users,
            'pendingVerifications': unverified_users,
            'farmers': farmers,
            'processors': processors,
            'totalBatches': total_batches,
            'activeDemands': total_demands,
            'totalLots': total_lots,
            'confirmedLots': confirmed_lots,
            'recentActivity': AuditLog.query.count(),
            'batchesByQuality': batches_by_quality,
            'batchesByStatus': batches_by_status,
            'batchesByCrop': [{'crop': c or 'Other', 'count': n} for c, n in batches_by_crop],
            'activityTrend': activity_trend,
            'recentEvents': recent_events,
        }
    }), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    verification_status = request.args.get('verification_status')

    query = User.query
    if role:
        query = query.filter_by(role=role)
    if verification_status:
        query = query.filter_by(verification_status=verification_status)

    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [u.to_dict() for u in pagination.items],
        'meta': {'total': pagination.total, 'page': page, 'per_page': per_page, 'pages': pagination.pages}
    }), 200


@admin_bp.route('/users/<int:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403
    user = User.query.get_or_404(id)
    return jsonify({'success': True, 'data': user.to_dict()}), 200


@admin_bp.route('/users/<int:id>/verify', methods=['POST'])
@jwt_required()
def verify_user(id):
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403

    user = User.query.get_or_404(id)
    user.verification_status = 'verified'

    record = VerificationRecord(
        user_id=user.id,
        reviewer_id=admin.id,
        status='verified',
        notes='Verified by admin'
    )
    db.session.add(record)

    from app.services.audit_service import log_audit
    log_audit(actor_id=admin.id, action='verify_user', entity_type='user', entity_id=user.id,
              metadata={'name': user.name})

    from app.services.notification_service import NotificationService
    NotificationService.send(
        user_id=user.id,
        type_str='user_verified',
        title='Account Verified!',
        message='Your account has been verified by the admin team.',
        entity_type='user',
        entity_id=user.id
    )

    db.session.commit()
    return jsonify({'success': True, 'data': user.to_dict(), 'message': 'User verified successfully'}), 200


@admin_bp.route('/users/<int:id>/suspend', methods=['POST'])
@jwt_required()
def suspend_user(id):
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403

    user = User.query.get_or_404(id)
    user.is_active = not user.is_active
    new_status = 'unverified' if not user.is_active else user.verification_status
    user.verification_status = new_status if user.is_active else 'suspended'

    record = VerificationRecord(
        user_id=user.id,
        reviewer_id=admin.id,
        status='suspended' if not user.is_active else 'reinstated',
        notes='Toggled by admin'
    )
    db.session.add(record)

    from app.services.audit_service import log_audit
    log_audit(actor_id=admin.id, action='suspend_user', entity_type='user', entity_id=user.id,
              metadata={'is_active': user.is_active, 'name': user.name})

    db.session.commit()
    return jsonify({'success': True, 'data': user.to_dict(), 'message': 'User status toggled'}), 200


@admin_bp.route('/users/<int:id>/delete', methods=['POST'])
@jwt_required()
def delete_user(id):
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403
    user = User.query.get_or_404(id)
    if user.id == admin.id or user.role == 'admin':
        return jsonify({'success': False, 'error': {'code': 'INVALID_ACTION', 'message': 'Admin accounts cannot be removed here'}}), 400
    user.is_active = False
    user.verification_status = 'removed'
    db.session.add(Notification(user_id=user.id, type='account_removed', title='Account access removed', message='An administrator removed access to your M2M account. Contact support if you believe this was a mistake.'))
    from app.services.audit_service import log_audit
    log_audit(actor_id=admin.id, action='remove_user', entity_type='user', entity_id=user.id, metadata={'name': user.name})
    db.session.commit()
    return jsonify({'success': True, 'data': user.to_dict()}), 200


@admin_bp.route('/batches/<int:id>/remove', methods=['POST'])
@jwt_required()
def remove_batch(id):
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403
    batch = ProduceBatch.query.get_or_404(id)
    reason = (request.get_json(silent=True) or {}).get('reason') or 'Removed by administrator after moderation review.'
    batch.status = 'removed'
    db.session.add(Notification(user_id=batch.farmer_id, type='listing_removed', title='Listing removed', message=reason, entity_type='batch', entity_id=batch.id))
    from app.services.audit_service import log_audit
    log_audit(actor_id=admin.id, action='remove_batch', entity_type='batch', entity_id=batch.id, metadata={'reason': reason})
    db.session.commit()
    return jsonify({'success': True, 'data': batch.to_dict()}), 200


@admin_bp.route('/demands/<int:id>/remove', methods=['POST'])
@jwt_required()
def remove_demand(id):
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403
    demand = ProcessorDemand.query.get_or_404(id)
    reason = (request.get_json(silent=True) or {}).get('reason') or 'Demand removed by administrator after moderation review.'
    demand.status = 'removed'
    db.session.add(Notification(user_id=demand.processor_id, type='demand_removed', title='Demand removed', message=reason, entity_type='demand', entity_id=demand.id))
    from app.services.audit_service import log_audit
    log_audit(actor_id=admin.id, action='remove_demand', entity_type='demand', entity_id=demand.id, metadata={'reason': reason})
    db.session.commit()
    return jsonify({'success': True, 'data': demand.to_dict()}), 200


@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def audit_logs():
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    action = request.args.get('action')
    entity_type = request.args.get('entity_type')

    query = AuditLog.query
    if action:
        query = query.filter_by(action=action)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)

    query = query.order_by(AuditLog.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [a.to_dict() for a in pagination.items],
        'meta': {'total': pagination.total, 'page': page, 'per_page': per_page, 'pages': pagination.pages}
    }), 200


@admin_bp.route('/moderation/scan', methods=['POST'])
@jwt_required()
def moderation_scan():
    admin = _get_admin_user()
    if not admin:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}}), 403
    from app.services.moderation_service import scan_text
    findings = []
    for batch in ProduceBatch.query.filter(ProduceBatch.status != 'removed').all():
        result = scan_text(batch.listing_description or batch.notes)
        if result['flagged']:
            findings.append({'type': 'batch', 'id': batch.id, 'code': batch.batch_code, **result})
    for demand in ProcessorDemand.query.filter(ProcessorDemand.status != 'removed').all():
        result = scan_text(demand.notes)
        if result['flagged']:
            findings.append({'type': 'demand', 'id': demand.id, 'code': demand.demand_code, **result})
    return jsonify({'success': True, 'data': {'findings': findings, 'review_required': len(findings)}}), 200
