from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_, and_

from app import db
from app.models.batch import ProduceBatch
from app.models.community import CommunityConversation, CommunityMessage, CommunityLike
from app.models.user import User
from app.models.demand import ProcessorDemand

community_bp = Blueprint('community', __name__)


@community_bp.route('/feed', methods=['GET'])
@jwt_required()
def feed():
    user_id = int(get_jwt_identity())
    search = (request.args.get('search') or '').strip()
    crop = request.args.get('crop')
    listings = []
    batch_query = ProduceBatch.query.filter(ProduceBatch.status.in_(['available', 'assessed', 'assessment_complete', 'decision_made']))
    demand_query = ProcessorDemand.query.filter_by(status='open')
    if crop:
        batch_query = batch_query.filter_by(crop=crop)
        demand_query = demand_query.filter_by(crop=crop)
    if search:
        term = f'%{search}%'
        batch_query = batch_query.filter(or_(ProduceBatch.crop.ilike(term), ProduceBatch.variety.ilike(term), ProduceBatch.listing_description.ilike(term)))
        demand_query = demand_query.filter(or_(ProcessorDemand.crop.ilike(term), ProcessorDemand.notes.ilike(term)))

    for batch in batch_query.order_by(ProduceBatch.created_at.desc()).limit(30).all():
        listings.append({
            'id': batch.id, 'type': 'sell', 'title': f'{batch.crop} available',
            'owner_id': batch.farmer_id,
            'owner_role': 'farmer',
            'crop': batch.crop, 'quantity': batch.quantity, 'unit': batch.unit,
            'quality': batch.initial_quality_estimate or 'To be discussed',
            'image_path': batch.image_path,
            'price_min': batch.asking_price_min,
            'price_max': batch.asking_price_max,
            'region': 'Nearby network', 'seller_label': 'Verified grower',
            'description': batch.listing_description,
            'likes': CommunityLike.query.filter_by(listing_type='sell', listing_id=batch.id).count(),
            'liked': CommunityLike.query.filter_by(listing_type='sell', listing_id=batch.id, user_id=user_id).first() is not None,
            'created_at': batch.created_at.isoformat() if batch.created_at else None,
        })
    for demand in demand_query.order_by(ProcessorDemand.created_at.desc()).limit(30).all():
        listings.append({
            'id': demand.id, 'type': 'buy', 'title': f'{demand.crop} wanted',
            'owner_id': demand.processor_id,
            'owner_role': 'buyer',
            'crop': demand.crop, 'quantity': demand.required_quantity, 'unit': demand.unit,
            'quality': demand.minimum_quality, 'region': demand.preferred_region or 'Flexible region',
            'seller_label': 'Verified buyer',
            'price': demand.offered_price_per_unit,
            'deadline': demand.deadline.isoformat() if demand.deadline else None,
            'created_at': demand.created_at.isoformat() if demand.created_at else None,
            'description': demand.notes or f'{demand.crop} required for direct purchase.',
            'likes': CommunityLike.query.filter_by(listing_type='buy', listing_id=demand.id).count(),
            'liked': CommunityLike.query.filter_by(listing_type='buy', listing_id=demand.id, user_id=user_id).first() is not None,
        })
    listings.sort(key=lambda item: item['created_at'] or '', reverse=True)
    return jsonify({'success': True, 'data': listings}), 200


@community_bp.route('/conversations', methods=['GET'])
@jwt_required()
def conversations():
    user_id = int(get_jwt_identity())
    rows = CommunityConversation.query.filter(
        or_(CommunityConversation.buyer_id == user_id, CommunityConversation.seller_id == user_id)
    ).order_by(CommunityConversation.created_at.desc()).all()
    data = []
    for row in rows:
        latest = CommunityMessage.query.filter_by(conversation_id=row.id).order_by(CommunityMessage.created_at.desc()).first()
        data.append({'id': row.id, 'listing_type': row.listing_type, 'listing_id': row.listing_id,
                     'counterparty_label': 'Community member', 'last_message': latest.body if latest else 'New conversation'})
    return jsonify({'success': True, 'data': data}), 200


@community_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    user_id = int(get_jwt_identity())
    current_user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    listing_type = data.get('listing_type')
    listing_id = data.get('listing_id')
    if listing_type not in ('buy', 'sell') or not isinstance(listing_id, int):
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'A valid listing is required'}}), 400

    if listing_type == 'sell':
        if current_user.role not in ('buyer', 'processor', 'admin'):
            return jsonify({'success': False, 'error': {'code': 'ROLE_NOT_ALLOWED', 'message': 'Only buyers can contact a seller'}}), 403
        listing = ProduceBatch.query.get_or_404(listing_id)
        owner_id = listing.farmer_id
    else:
        if current_user.role not in ('farmer', 'fpo', 'admin'):
            return jsonify({'success': False, 'error': {'code': 'ROLE_NOT_ALLOWED', 'message': 'Only sellers can contact a buyer'}}), 403
        listing = ProcessorDemand.query.get_or_404(listing_id)
        owner_id = listing.processor_id
    if owner_id == user_id:
        return jsonify({'success': False, 'error': {'code': 'INVALID_ACTION', 'message': 'You cannot message your own listing'}}), 400

    buyer_id, seller_id = (user_id, owner_id) if listing_type == 'sell' else (owner_id, user_id)
    conversation = CommunityConversation.query.filter_by(
        listing_type=listing_type, listing_id=listing_id, buyer_id=buyer_id, seller_id=seller_id
    ).first()
    if not conversation:
        conversation = CommunityConversation(listing_type=listing_type, listing_id=listing_id,
                                             buyer_id=buyer_id, seller_id=seller_id)
        db.session.add(conversation)
        db.session.commit()
    return jsonify({'success': True, 'data': {'id': conversation.id}}), 200


@community_bp.route('/likes', methods=['POST'])
@jwt_required()
def toggle_like():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    listing_type = data.get('listing_type')
    listing_id = data.get('listing_id')
    if listing_type not in ('buy', 'sell') or not isinstance(listing_id, int):
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'A valid listing is required'}}), 400
    if listing_type == 'sell':
        listing = ProduceBatch.query.get_or_404(listing_id)
        if User.query.get(user_id).role not in ('buyer', 'processor', 'admin'):
            return jsonify({'success': False, 'error': {'code': 'ROLE_NOT_ALLOWED', 'message': 'Only buyers can like seller listings'}}), 403
    else:
        listing = ProcessorDemand.query.get_or_404(listing_id)
        if User.query.get(user_id).role not in ('farmer', 'fpo', 'admin'):
            return jsonify({'success': False, 'error': {'code': 'ROLE_NOT_ALLOWED', 'message': 'Only sellers can like buyer listings'}}), 403
    like = CommunityLike.query.filter_by(listing_type=listing_type, listing_id=listing_id, user_id=user_id).first()
    if like:
        db.session.delete(like)
        liked = False
    else:
        db.session.add(CommunityLike(listing_type=listing_type, listing_id=listing_id, user_id=user_id))
        liked = True
    db.session.commit()
    return jsonify({'success': True, 'data': {'liked': liked, 'likes': CommunityLike.query.filter_by(listing_type=listing_type, listing_id=listing_id).count()}}), 200


@community_bp.route('/listings/<string:listing_type>/<int:listing_id>/unlist', methods=['POST'])
@jwt_required()
def unlist_listing(listing_type, listing_id):
    user_id = int(get_jwt_identity())
    if listing_type != 'sell':
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_ACTION', 'message': 'Only sell listings can be unlisted here'}
        }), 400

    listing = ProduceBatch.query.get_or_404(listing_id)
    owner = User.query.get_or_404(user_id)
    if owner.role not in ('farmer', 'fpo') or listing.farmer_id != user_id:
        return jsonify({
            'success': False,
            'error': {'code': 'FORBIDDEN', 'message': 'Only the seller can unlist this produce'}
        }), 403

    if listing.status not in ('available', 'assessed', 'assessment_complete', 'decision_made'):
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_ACTION', 'message': 'This listing is already unlisted'}
        }), 400

    listing.status = 'draft'
    db.session.commit()
    return jsonify({'success': True, 'data': listing.to_dict()}), 200


@community_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET', 'POST'])
@jwt_required()
def messages(conversation_id):
    user_id = int(get_jwt_identity())
    conversation = CommunityConversation.query.get_or_404(conversation_id)
    if user_id not in (conversation.buyer_id, conversation.seller_id):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Access denied'}}), 403
    if request.method == 'POST':
        body = (request.get_json(silent=True) or {}).get('body', '').strip()
        if not body:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'Message cannot be empty'}}), 400
        message = CommunityMessage(conversation_id=conversation_id, sender_id=user_id, body=body[:2000])
        db.session.add(message)
        db.session.commit()
        return jsonify({'success': True, 'data': message.to_dict(user_id)}), 201
    rows = CommunityMessage.query.filter_by(conversation_id=conversation_id).order_by(CommunityMessage.created_at.asc()).all()
    return jsonify({'success': True, 'data': [row.to_dict(user_id) for row in rows]}), 200
