from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.batch import ProduceBatch
from app.models.assessment import Assessment
from app.models.decision import DecisionResult
from app.models.user import User
from app.services.assessment_service import AssessmentService
from app.services.decision_engine import run_decision_engine
from app import db
import uuid
import os
from datetime import datetime
from werkzeug.utils import secure_filename

batches_bp = Blueprint('batches', __name__)

ALLOWED_IMAGE_EXT = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXT


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


@batches_bp.route('', methods=['GET'])
@jwt_required()
def list_batches():
    user_id = _int_uid()
    user = User.query.get(user_id) if user_id else None
    if not user:
        return jsonify({'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Invalid token'}}), 401

    status_filter = request.args.get('status')

    if user.role == 'farmer':
        q = ProduceBatch.query.filter_by(farmer_id=user_id)
    elif user.role in ('processor', 'buyer', 'admin'):
        q = ProduceBatch.query
        only_available = request.args.get('only_available') in ('1', 'true', 'True')
        if only_available:
            q = q.filter(ProduceBatch.status.in_(['available', 'decision_ready']))
    else:
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Access denied'}}), 403

    if status_filter:
        q = q.filter_by(status=status_filter)

    batches = q.order_by(ProduceBatch.created_at.desc()).all()
    result = []
    for b in batches:
        item = b.to_dict()
        assessment = Assessment.query.filter_by(batch_id=b.id).first()
        decision = DecisionResult.query.filter_by(batch_id=b.id).first()
        item['assessment'] = assessment.to_dict() if assessment else None
        item['decision'] = decision.to_dict() if decision else None
        result.append(item)
    return jsonify({'success': True, 'data': result}), 200


@batches_bp.route('', methods=['POST'])
@jwt_required()
def create_batch():
    user_id = _int_uid()
    data = request.json or {}
    try:
        harvest_date = _parse_date_safe(data.get('harvest_date'), 'harvest_date')
        availability_start = _parse_date_safe(data.get('availability_start') or data.get('harvest_date'), 'availability_start')
        availability_end = _parse_date_safe(data.get('availability_end') or data.get('availability_start') or data.get('harvest_date'), 'availability_end')
        description = (data.get('listing_description') or '').strip()
        if not description:
            description = f"Fresh {data.get('crop') or 'produce'} available in {data.get('quantity') or 0} {data.get('unit', 'kg')}, harvested on {harvest_date.isoformat()}. Quality: {data.get('initial_quality_estimate') or 'to be discussed'}. Contact me through the community to discuss delivery and final price."
        b = ProduceBatch(
            batch_code=data.get('batch_code') or f"BAT-{uuid.uuid4().hex[:6].upper()}",
            farmer_id=user_id,
            crop=data.get('crop') or 'Tomato',
            variety=data.get('variety'),
            quantity=float(data.get('quantity') or 0),
            unit=data.get('unit', 'kg'),
            harvest_date=harvest_date,
            availability_start=availability_start,
            availability_end=availability_end,
            initial_quality_estimate=data.get('initial_quality_estimate'),
            maturity_level=data.get('maturity_level'),
            visible_defects=data.get('visible_defects'),
            spoilage_signs=data.get('spoilage_signs'),
            location=data.get('location'),
            storage_condition=data.get('storage_condition'),
            notes=data.get('notes'),
            asking_price_min=float(data['asking_price_min']) if data.get('asking_price_min') is not None else None,
            asking_price_max=float(data['asking_price_max']) if data.get('asking_price_max') is not None else None,
            listing_description=description,
            status=data.get('status') or 'draft',
        )
    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400

    if b.quantity <= 0:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'quantity must be > 0'}}), 400

    db.session.add(b)
    db.session.commit()
    return jsonify({'success': True, 'data': b.to_dict()}), 201


@batches_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_batch(id):
    b = ProduceBatch.query.get_or_404(id)
    a = Assessment.query.filter_by(batch_id=id).first()
    d = DecisionResult.query.filter_by(batch_id=id).first()
    return jsonify({
        'success': True,
        'data': {
            'batch': b.to_dict(),
            'assessment': a.to_dict() if a else None,
            'decision': d.to_dict() if d else None
        }
    }), 200


@batches_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_batch(id):
    user_id = _int_uid()
    b = ProduceBatch.query.get_or_404(id)
    user = User.query.get(user_id)

    if b.farmer_id != user_id and (not user or user.role != 'admin'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Cannot update this batch'}}), 403

    data = request.json or {}
    try:
        if 'harvest_date' in data:
            b.harvest_date = _parse_date_safe(data['harvest_date'], 'harvest_date')
        if 'availability_start' in data:
            b.availability_start = _parse_date_safe(data['availability_start'], 'availability_start')
        if 'availability_end' in data:
            b.availability_end = _parse_date_safe(data['availability_end'], 'availability_end')
    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400

    for field in [
        'crop', 'variety', 'unit', 'initial_quality_estimate', 'maturity_level',
        'visible_defects', 'spoilage_signs', 'location', 'storage_condition', 'notes', 'status'
    ]:
        if field in data:
            setattr(b, field, data[field])

    if 'quantity' in data:
        q = float(data['quantity'] or 0)
        if q <= 0:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'quantity must be > 0'}}), 400
        b.quantity = q

    db.session.commit()
    return jsonify({'success': True, 'data': b.to_dict()}), 200


@batches_bp.route('/<int:id>/assessment', methods=['GET'])
@jwt_required()
def get_assessment(id):
    ProduceBatch.query.get_or_404(id)
    a = Assessment.query.filter_by(batch_id=id).first()
    return jsonify({'success': True, 'data': a.to_dict() if a else None}), 200


@batches_bp.route('/<int:id>/decision', methods=['GET'])
@jwt_required()
def get_decision(id):
    ProduceBatch.query.get_or_404(id)
    d = DecisionResult.query.filter_by(batch_id=id).first()
    return jsonify({'success': True, 'data': d.to_dict() if d else None}), 200


@batches_bp.route('/<int:id>/assess', methods=['POST'])
@jwt_required()
def assess_batch(id):
    user_id = _int_uid()
    batch = ProduceBatch.query.get_or_404(id)
    user = User.query.get(user_id)
    if batch.farmer_id != user_id and (not user or user.role not in ('admin', 'buyer', 'processor')):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Cannot assess this batch'}}), 403
    service = AssessmentService()
    image_path = None
    if request.files:
        file = request.files.get('file') or request.files.get('image')
        if file and file.filename and _allowed_file(file.filename):
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            if not os.path.isabs(upload_folder):
                upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), upload_folder)
            upload_folder = os.path.abspath(upload_folder)
            os.makedirs(upload_folder, exist_ok=True)
            ext = file.filename.rsplit('.', 1)[1].lower()
            safe_name = secure_filename(f"assessment_{id}_{uuid.uuid4().hex[:8]}.{ext}")
            image_path = os.path.join(upload_folder, safe_name)
            file.save(image_path)
            batch.image_path = image_path
            db.session.commit()
        elif file:
            return jsonify({'success': False, 'error': {'code': 'INVALID_FILE_TYPE', 'message': 'Invalid image type'}}), 400
    result = service.run(id, image_path=image_path)
    if not result:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Batch not found'}}), 404

    from app.services.audit_service import log_audit
    log_audit(actor_id=user_id, action='assess_batch', entity_type='batch', entity_id=id)
    return jsonify({'success': True, 'data': result}), 200


@batches_bp.route('/<int:id>/decision', methods=['POST'])
@jwt_required()
def decide_batch(id):
    batch = ProduceBatch.query.get_or_404(id)
    user_id = _int_uid()
    user = User.query.get(user_id)
    if not user or (batch.farmer_id != user_id and user.role not in ('processor', 'buyer', 'admin')):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'You can only generate a decision for your own batch'}}), 403
    assessment = Assessment.query.filter_by(batch_id=id).first()
    if not assessment:
        assessment = AssessmentService().run(id)
        if not assessment:
            return jsonify({'success': False, 'error': {'code': 'ASSESSMENT_REQUIRED', 'message': 'Run the batch assessment before generating a decision'}}), 400
    result = run_decision_engine(id)
    if not result:
        return jsonify({'success': False, 'error': {'code': 'DECISION_FAILED', 'message': 'Decision could not be generated from this batch data'}}), 422
    if result:
        from app.services.audit_service import log_audit
        log_audit(actor_id=user_id, action='decide_batch', entity_type='batch', entity_id=id)
    return jsonify({'success': True, 'data': result}), 200


@batches_bp.route('/<int:id>/upload-image', methods=['POST'])
@jwt_required()
def upload_batch_image(id):
    user_id = _int_uid()
    b = ProduceBatch.query.get_or_404(id)
    user = User.query.get(user_id)
    if b.farmer_id != user_id and (not user or user.role != 'admin'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Cannot upload image for this batch'}}), 403

    if 'file' not in request.files and 'image' not in request.files:
        return jsonify({'success': False, 'error': {'code': 'NO_FILE', 'message': 'No file provided'}}), 400

    file = request.files.get('file') or request.files.get('image')
    if not file or file.filename == '':
        return jsonify({'success': False, 'error': {'code': 'NO_FILE', 'message': 'Empty filename'}}), 400

    if not _allowed_file(file.filename):
        return jsonify({'success': False, 'error': {'code': 'INVALID_FILE_TYPE', 'message': 'Invalid image type'}}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    safe_name = secure_filename(f"batch_{b.id}_{uuid.uuid4().hex[:8]}.{ext}")
    save_path = os.path.join(upload_folder, safe_name)
    file.save(save_path)

    b.image_path = save_path
    db.session.commit()

    if Assessment.query.filter_by(batch_id=id).first():
        Assessment.query.filter_by(batch_id=id).update({'image_path': save_path})
        db.session.commit()

    return jsonify({
        'success': True,
        'data': {'batch_id': id, 'image_path': save_path, 'filename': safe_name}
    }), 200


@batches_bp.route('/public', methods=['GET'])
def public_batches():
    batches = ProduceBatch.query.filter_by(status='available').all()
    return jsonify({'success': True, 'data': [b.to_dict() for b in batches]}), 200
