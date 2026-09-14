from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.demand import ProcessorDemand
from app.models.lot import ProcurementLot
from app.models.user import User
from app.services.matching_engine import run_matching
from app import db
import uuid
from datetime import datetime

demands_bp = Blueprint('demands', __name__)


def _parse_date_safe(val, field_name):
    if isinstance(val, datetime):
        return val.date()
    if not val:
        raise ValueError(f'{field_name} is required')
    try:
        return datetime.strptime(val, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValueError(f'{field_name} must be YYYY-MM-DD')


def _int_uid():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None


@demands_bp.route('', methods=['GET'])
@jwt_required()
def list_demands():
    user_id = _int_uid()
    user = User.query.get(user_id) if user_id else None
    if not user:
        return jsonify({'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Invalid token'}}), 401

    status = request.args.get('status')
    q = ProcessorDemand.query
    if user.role in ('processor', 'buyer'):
        q = q.filter_by(processor_id=user_id)
    # farmer/admin sees all (or filtered by open for farmer)
    if status:
        if status == 'open':
            q = q.filter(ProcessorDemand.status.in_(['open', 'matching']))
        else:
            q = q.filter_by(status=status)

    demands = q.order_by(ProcessorDemand.created_at.desc()).all()
    return jsonify({'success': True, 'data': [d.to_dict() for d in demands]}), 200


@demands_bp.route('', methods=['POST'])
@jwt_required()
def create_demand():
    user_id = _int_uid()
    user = User.query.get(user_id)
    if not user or user.role not in ('processor', 'buyer', 'admin'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Only processors can create demands'}}), 403

    data = request.json or {}
    try:
        d = ProcessorDemand(
            demand_code=data.get('demand_code') or f"DEM-{uuid.uuid4().hex[:6].upper()}",
            processor_id=user_id,
            crop=data.get('crop') or 'Tomato',
            variety=data.get('variety'),
            required_quantity=float(data.get('required_quantity') or 0),
            unit=data.get('unit', 'kg'),
            minimum_quality=data.get('minimum_quality', 'C'),
            deadline=_parse_date_safe(data.get('deadline'), 'deadline'),
            preferred_region=data.get('preferred_region'),
            acceptable_harvest_window=int(data.get('acceptable_harvest_window') or 7),
            processing_category=data.get('processing_category'),
            offered_price_per_unit=float(data['offered_price_per_unit']) if data.get('offered_price_per_unit') is not None else None,
            offer_currency=data.get('offer_currency', 'INR'),
            notes=data.get('notes'),
            status=data.get('status') or 'open',
        )
    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400

    if d.required_quantity <= 0:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'required_quantity must be > 0'}}), 400

    db.session.add(d)
    db.session.commit()
    return jsonify({'success': True, 'data': d.to_dict()}), 201


@demands_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_demand(id):
    d = ProcessorDemand.query.get_or_404(id)
    lots = ProcurementLot.query.filter_by(demand_id=id).all()
    return jsonify({
        'success': True,
        'data': {
            'demand': d.to_dict(),
            'lots': [l.to_dict() for l in lots],
        }
    }), 200


@demands_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_demand(id):
    user_id = _int_uid()
    d = ProcessorDemand.query.get_or_404(id)
    user = User.query.get(user_id)
    if d.processor_id != user_id and (not user or user.role != 'admin'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Cannot update this demand'}}), 403

    data = request.json or {}
    try:
        if 'deadline' in data:
            d.deadline = _parse_date_safe(data['deadline'], 'deadline')
    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400

    for field in [
        'crop', 'variety', 'unit', 'minimum_quality', 'preferred_region',
        'processing_category', 'offer_currency', 'notes', 'status'
    ]:
        if field in data:
            setattr(d, field, data[field])

    if 'required_quantity' in data:
        q = float(data['required_quantity'] or 0)
        if q <= 0:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'required_quantity must be > 0'}}), 400
        d.required_quantity = q
    if 'acceptable_harvest_window' in data:
        d.acceptable_harvest_window = int(data['acceptable_harvest_window'] or d.acceptable_harvest_window or 7)
    if 'offered_price_per_unit' in data:
        v = data['offered_price_per_unit']
        d.offered_price_per_unit = float(v) if v is not None else None

    db.session.commit()
    return jsonify({'success': True, 'data': d.to_dict()}), 200


@demands_bp.route('/<int:id>/close', methods=['POST'])
@jwt_required()
def close_demand(id):
    user_id = _int_uid()
    d = ProcessorDemand.query.get_or_404(id)
    user = User.query.get(user_id)
    if d.processor_id != user_id and (not user or user.role != 'admin'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Cannot close this demand'}}), 403

    data = request.json or {}
    d.status = data.get('status') or 'closed'
    db.session.commit()
    return jsonify({'success': True, 'data': d.to_dict(), 'message': 'Demand closed'}), 200


@demands_bp.route('/<int:id>/match', methods=['POST'])
@jwt_required()
def match_demand(id):
    user_id = _int_uid()
    d = ProcessorDemand.query.get_or_404(id)
    user = User.query.get(user_id)
    if d.processor_id != user_id and (not user or user.role != 'admin'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Cannot run matching for this demand'}}), 403

    result = run_matching(id)
    return jsonify({'success': True, 'data': result}), 200


@demands_bp.route('/<int:id>/matches', methods=['GET'])
@jwt_required()
def get_matches(id):
    ProcessorDemand.query.get_or_404(id)
    lots = ProcurementLot.query.filter_by(demand_id=id).all()
    return jsonify({'success': True, 'data': [l.to_dict() for l in lots]}), 200
