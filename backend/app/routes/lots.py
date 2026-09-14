from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.lot import ProcurementLot, LotBatchMapping
from app.models.batch import ProduceBatch
from app.models.notification import Notification
from app import db

lots_bp = Blueprint('lots', __name__)

def _require_role(user_id, allowed_roles):
    from app.models.user import User
    user = User.query.get(user_id)
    if not user or user.role not in allowed_roles:
        return None, jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Access denied'}}), 403
    return user, None, None

@lots_bp.route('', methods=['GET'])
@jwt_required()
def list_lots():
    user_id = int(get_jwt_identity())
    from app.models.user import User
    user = User.query.get(user_id)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status')

    query = ProcurementLot.query
    if user.role in ('processor', 'buyer'):
        from app.models.demand import ProcessorDemand
        demand_ids = [d.id for d in ProcessorDemand.query.filter_by(processor_id=user_id).all()]
        query = query.filter(ProcurementLot.demand_id.in_(demand_ids))
    elif user.role == 'farmer':
        # Lots where farmer has a batch included
        batch_ids = [b.id for b in ProduceBatch.query.filter_by(farmer_id=user_id).all()]
        mapping_lot_ids = [m.lot_id for m in LotBatchMapping.query.filter(LotBatchMapping.batch_id.in_(batch_ids)).all()]
        query = query.filter(ProcurementLot.id.in_(mapping_lot_ids))
    # admin sees all

    if status_filter:
        query = query.filter_by(status=status_filter)

    query = query.order_by(ProcurementLot.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    result = []
    for lot in pagination.items:
        item = lot.to_dict()
        from app.models.demand import ProcessorDemand
        demand = ProcessorDemand.query.get(lot.demand_id)
        item['crop'] = demand.crop if demand else None
        item['unit'] = demand.unit if demand else 'kg'
        if user.role == 'farmer':
            mapping = LotBatchMapping.query.join(ProduceBatch, LotBatchMapping.batch_id == ProduceBatch.id).filter(
                LotBatchMapping.lot_id == lot.id, ProduceBatch.farmer_id == user_id
            ).first()
            item['farmer_response'] = mapping.farmer_response if mapping else 'pending'
            item['farmer_quantity'] = mapping.quantity_contributed if mapping else 0
        result.append(item)

    return jsonify({
        'success': True,
        'data': result,
        'meta': {'total': pagination.total, 'page': page, 'per_page': per_page, 'pages': pagination.pages}
    }), 200


@lots_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_lot(id):
    user_id = int(get_jwt_identity())
    lot = ProcurementLot.query.get_or_404(id)
    mappings = LotBatchMapping.query.filter_by(lot_id=id).all()
    mapping_data = []
    for m in mappings:
        b = ProduceBatch.query.get(m.batch_id)
        from app.models.assessment import Assessment
        a = Assessment.query.filter_by(batch_id=m.batch_id).first()
        from app.models.user import User
        farmer = User.query.get(b.farmer_id) if b else None
        mapping_data.append({
            **m.to_dict(),
            'batch': b.to_dict() if b else None,
            'assessment': a.to_dict() if a else None,
            'farmer_name': farmer.name if farmer else None,
            'farmer_location': farmer.location if farmer else None,
        })
    lot_dict = lot.to_dict()
    lot_dict['batch_mappings'] = mapping_data
    return jsonify({'success': True, 'data': lot_dict}), 200


@lots_bp.route('/<int:id>/confirm', methods=['POST'])
@jwt_required()
def confirm_lot(id):
    user_id = int(get_jwt_identity())
    lot = ProcurementLot.query.get_or_404(id)
    from app.models.demand import ProcessorDemand
    demand = ProcessorDemand.query.get(lot.demand_id)
    user = _require_role(user_id, ('buyer', 'processor', 'admin'))[0]
    if not user or (user.role != 'admin' and demand and demand.processor_id != user_id):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Only the buyer owner can confirm this lot'}}), 403
    data = request.json or {}

    if lot.status not in ('proposed', 'pending_review'):
        return jsonify({'success': False, 'error': {'code': 'INVALID_TRANSITION', 'message': f'Cannot confirm a lot with status: {lot.status}'}}), 409

    lot.status = 'confirmed'
    lot.processor_notes = data.get('notes', '')

    # Update batch statuses and notify farmers
    mappings = LotBatchMapping.query.filter_by(lot_id=id).all()
    for m in mappings:
        b = ProduceBatch.query.get(m.batch_id)
        if b:
            b.status = 'confirmed'
            notif = Notification(
                user_id=b.farmer_id,
                type='lot_confirmed',
                title='Procurement Confirmed!',
                message=f'Your batch {b.batch_code} has been confirmed for procurement lot {lot.lot_code}.',
                entity_type='lot',
                entity_id=lot.id
            )
            db.session.add(notif)

    from app.services.audit_service import log_audit
    log_audit(actor_id=user_id, action='confirm_lot', entity_type='lot', entity_id=lot.id, metadata={'lot_code': lot.lot_code})
    db.session.commit()
    return jsonify({'success': True, 'data': lot.to_dict(), 'message': 'Procurement lot confirmed successfully'}), 200


@lots_bp.route('/<int:id>/reject', methods=['POST'])
@jwt_required()
def reject_lot(id):
    user_id = int(get_jwt_identity())
    lot = ProcurementLot.query.get_or_404(id)
    from app.models.demand import ProcessorDemand
    demand = ProcessorDemand.query.get(lot.demand_id)
    user = _require_role(user_id, ('buyer', 'processor', 'admin'))[0]
    if not user or (user.role != 'admin' and demand and demand.processor_id != user_id):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Only the buyer owner can reject this lot'}}), 403
    data = request.json or {}

    if lot.status not in ('proposed', 'pending_review'):
        return jsonify({'success': False, 'error': {'code': 'INVALID_TRANSITION', 'message': f'Cannot reject a lot with status: {lot.status}'}}), 409

    lot.status = 'rejected'
    lot.processor_notes = data.get('notes', '')

    # Release batches back to available
    mappings = LotBatchMapping.query.filter_by(lot_id=id).all()
    for m in mappings:
        b = ProduceBatch.query.get(m.batch_id)
        if b:
            b.status = 'available'
            notif = Notification(
                user_id=b.farmer_id,
                type='lot_rejected',
                title='Lot Rejected',
                message=f'Procurement lot {lot.lot_code} was rejected. Your batch {b.batch_code} is now available again.',
                entity_type='lot',
                entity_id=lot.id
            )
            db.session.add(notif)

    from app.services.audit_service import log_audit
    log_audit(actor_id=user_id, action='reject_lot', entity_type='lot', entity_id=lot.id, metadata={'reason': data.get('notes', '')})
    db.session.commit()
    return jsonify({'success': True, 'data': lot.to_dict(), 'message': 'Lot rejected. Batches released back to available.'}), 200


@lots_bp.route('/<int:id>/farmer-respond', methods=['POST'])
@jwt_required()
def farmer_respond(id):
    user_id = int(get_jwt_identity())
    data = request.json or {}
    response = data.get('response')  # 'accepted' or 'declined'

    if response not in ('accepted', 'declined'):
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': "Response must be 'accepted' or 'declined'"}}), 400

    lot = ProcurementLot.query.get_or_404(id)
    # Find mapping for this farmer's batch
    farmer_batches = [b.id for b in ProduceBatch.query.filter_by(farmer_id=user_id).all()]
    mapping = LotBatchMapping.query.filter(
        LotBatchMapping.lot_id == id,
        LotBatchMapping.batch_id.in_(farmer_batches)
    ).first()

    if not mapping:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'No mapping found for your batch in this lot'}}), 404

    from datetime import datetime
    mapping.farmer_response = response
    mapping.farmer_response_at = datetime.utcnow()
    demand = ProcessorDemand.query.get(lot.demand_id)
    if demand and demand.processor_id != user_id:
        db.session.add(Notification(
            user_id=demand.processor_id,
            type='farmer_lot_response',
            title=f'Farmer {response} procurement offer',
            message=f'A farmer has {response} the offer in lot {lot.lot_code}.',
            entity_type='lot',
            entity_id=lot.id
        ))
    mappings = LotBatchMapping.query.filter_by(lot_id=id).all()
    if mappings and all(item.farmer_response in ('accepted', 'declined') for item in mappings):
        lot.status = 'farmer_accepted' if any(item.farmer_response == 'accepted' for item in mappings) else 'farmer_declined'
    db.session.commit()
    return jsonify({'success': True, 'data': mapping.to_dict(), 'message': f'Response recorded: {response}'}), 200