from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand
from app.models.lot import ProcurementLot, LotBatchMapping
from app.models.assessment import Assessment
from app.models.decision import DecisionResult
from datetime import date, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/farmer', methods=['GET'])
@jwt_required()
def farmer_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'farmer':
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Farmer access required'}}), 403

    batches = ProduceBatch.query.filter_by(farmer_id=user_id).all()
    total_batches = len(batches)
    available_batches = [b for b in batches if b.status == 'available']
    confirmed_batches = [b for b in batches if b.status == 'confirmed']
    in_procurement_batches = [b for b in batches if b.status == 'in_procurement']

    assessments_count = 0
    decision_count = 0
    for b in batches:
        if Assessment.query.filter_by(batch_id=b.id).first():
            assessments_count += 1
        if DecisionResult.query.filter_by(batch_id=b.id).first():
            decision_count += 1

    lot_ids = [
        m.lot_id
        for m in LotBatchMapping.query
        .join(ProduceBatch, ProduceBatch.id == LotBatchMapping.batch_id)
        .filter(ProduceBatch.farmer_id == user_id)
        .all()
    ]
    lots_with_farmer = ProcurementLot.query.filter(ProcurementLot.id.in_(lot_ids)).all() if lot_ids else []

    total_quantity = sum(b.quantity for b in batches)
    confirmed_quantity = sum(b.quantity for b in confirmed_batches)

    today = date.today()
    recent_crops = [b.crop for b in batches if b.harvest_date and (today - b.harvest_date).days <= 30]
    crop_counts = {}
    for c in recent_crops:
        crop_counts[c] = crop_counts.get(c, 0) + 1

    return jsonify({
        'success': True,
        'data': {
            'farmer': user.to_dict(),
            'totalBatches': total_batches,
            'availableQuantity': total_quantity,
            'availableBatches': len(available_batches),
            'confirmedBatches': len(confirmed_batches),
            'pendingDecisions': max(0, total_batches - decision_count),
            'decisionsCompleted': decision_count,
            'matchedOpportunities': len(lots_with_farmer),
            'activeLots': len(lots_with_farmer),
            'completed': len(confirmed_batches),
            'stats': {
                'totalBatches': total_batches,
                'availableQuantity': total_quantity,
                'pendingDecisions': max(0, total_batches - decision_count),
                'matchedOpportunities': len(lots_with_farmer),
                'activeLots': len(lots_with_farmer),
                'completed': len(confirmed_batches),
                'decisionsCompleted': decision_count,
                'assessmentsCompleted': assessments_count,
            },
            'recentBatches': [b.to_dict() for b in batches[:5]],
            'cropsSummary': crop_counts,
        }
    }), 200


@dashboard_bp.route('/processor', methods=['GET'])
@jwt_required()
def processor_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role not in ('processor', 'buyer'):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Buyer access required'}}), 403

    demands = ProcessorDemand.query.filter_by(processor_id=user_id).all()
    demand_ids = [d.id for d in demands]
    lots = ProcurementLot.query.filter(ProcurementLot.demand_id.in_(demand_ids)).all()
    confirmed_lots = [l for l in lots if l.status == 'confirmed']
    proposed_lots = [l for l in lots if l.status == 'proposed']

    total_required = sum(d.required_quantity for d in demands)
    total_matched = sum(l.total_quantity for l in confirmed_lots)

    open_demands = [d for d in demands if d.status in ('open', 'matching')]
    matched_demands = [d for d in demands if d.status == 'fully_matched']

    crop_counts = {}
    for d in demands:
        crop_counts[d.crop] = crop_counts.get(d.crop, 0) + 1

    return jsonify({
        'success': True,
        'data': {
            'processor': user.to_dict(),
            'activeDemands': len(open_demands),
            'totalQuantityRequested': total_required,
            'compatibleSupplyFound': total_matched,
            'matchedQuantity': total_matched,
            'pendingConfirmations': len(proposed_lots),
            'completedLots': len(confirmed_lots),
            'stats': {
                'activeDemands': len(open_demands),
                'totalQuantityRequested': total_required,
                'compatibleSupplyFound': total_matched,
                'matchedQuantity': total_matched,
                'pendingConfirmations': len(proposed_lots),
                'completedLots': len(confirmed_lots),
                'totalDemands': len(demands),
                'totalLots': len(lots),
                'matchRate': round((total_matched / total_required) * 100, 1) if total_required > 0 else 0,
            },
            'recentDemands': [d.to_dict() for d in demands[:5]],
            'recentLots': [l.to_dict() for l in lots[:5]],
            'cropsSummary': crop_counts,
        }
    }), 200
