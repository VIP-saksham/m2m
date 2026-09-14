from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.batch import ProduceBatch
from app.models.assessment import Assessment
from app.models.decision import DecisionResult

assistant_bp = Blueprint('assistant', __name__)


@assistant_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    question = (request.json or {}).get('question', '').strip()
    if not question:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'question is required'}}), 400
    if len(question) > 1000:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': 'question is too long'}}), 400

    user_id = int(get_jwt_identity())
    batches = []
    for batch in ProduceBatch.query.filter_by(farmer_id=user_id).order_by(ProduceBatch.created_at.desc()).limit(5).all():
        item = batch.to_dict()
        assessment = Assessment.query.filter_by(batch_id=batch.id).first()
        decision = DecisionResult.query.filter_by(batch_id=batch.id).first()
        item['assessment'] = assessment.to_dict() if assessment else None
        item['decision'] = decision.to_dict() if decision else None
        batches.append(item)

    from app.services.assistant_service import answer
    result = answer(question, batches, current_app.config)
    return jsonify({'success': True, 'data': result}), 200
