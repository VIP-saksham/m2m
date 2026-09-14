from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.notification import Notification
from app import db
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)


def _int_uid():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifs():
    user_id = _int_uid()
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify({'success': True, 'data': [n.to_dict() for n in notifs]}), 200


@notifications_bp.route('/count', methods=['GET'])
@jwt_required()
def count_unread():
    user_id = _int_uid()
    unread = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    total = Notification.query.filter_by(user_id=user_id).count()
    return jsonify({
        'success': True,
        'data': {
            'count': unread,
            'unread': unread,
            'total': total,
        }
    }), 200


@notifications_bp.route('/<int:id>/read', methods=['POST'])
@jwt_required()
def mark_read(id):
    user_id = _int_uid()
    n = Notification.query.get_or_404(id)
    if n.user_id != user_id:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not your notification'}}), 403

    n.is_read = True
    db.session.commit()
    unread = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({
        'success': True,
        'data': {
            'notification': n.to_dict(),
            'count': unread,
            'unread': unread,
        },
        'message': 'Marked as read'
    }), 200


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    user_id = _int_uid()
    Notification.query.filter_by(user_id=user_id, is_read=False).update(
        {Notification.is_read: True}, synchronize_session=False
    )
    db.session.commit()
    unread = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({
        'success': True,
        'data': {'count': unread, 'unread': unread},
        'message': 'All notifications marked as read'
    }), 200
