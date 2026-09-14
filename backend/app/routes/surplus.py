from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand
from collections import defaultdict
from datetime import date, timedelta

surplus_bp = Blueprint('surplus', __name__)


@surplus_bp.route('/radar', methods=['GET'])
def surplus_radar():
    today = date.today()
    horizon = request.args.get('horizon', 14, type=int)
    cutoff = today + timedelta(days=horizon)

    batches = ProduceBatch.query.filter(
        ProduceBatch.status.in_(['available', 'decision_ready', 'assessment_complete'])
    ).all()
    demands = ProcessorDemand.query.filter(
        ProcessorDemand.status.in_(['open', 'matching'])
    ).all()

    supply_by_crop = defaultdict(lambda: {'quantity': 0, 'expiring': 0, 'batches': 0, 'regions': set()})
    for b in batches:
        s = supply_by_crop[b.crop]
        s['quantity'] += b.quantity
        s['batches'] += 1
        if b.location:
            s['regions'].add(b.location)
        if b.availability_end and b.availability_end <= cutoff:
            s['expiring'] += b.quantity

    demand_by_crop = defaultdict(float)
    for d in demands:
        demand_by_crop[d.crop] += d.required_quantity

    crops = sorted(set(list(supply_by_crop.keys()) + list(demand_by_crop.keys()) + ['Tomato', 'Potato', 'Onion']))
    radar = []
    for c in crops:
        sup = supply_by_crop.get(c, {'quantity': 0, 'expiring': 0, 'batches': 0, 'regions': set()})
        dem = demand_by_crop.get(c, 0)
        surplus = sup['quantity'] - dem
        if surplus > 0:
            severity = 'high' if surplus >= 5000 else ('medium' if surplus >= 1000 else 'low')
        elif surplus < 0:
            severity = 'shortage'
        else:
            severity = 'balanced'
        radar.append({
            'crop': c,
            'supply_quantity': sup['quantity'],
            'demand_quantity': dem,
            'delta': surplus,
            'delta_percent': round((surplus / dem * 100), 1) if dem > 0 else 100 if surplus > 0 else 0,
            'expiring_quantity': sup['expiring'],
            'batches_count': sup['batches'],
            'regions': list(sup['regions']) or ['Multi-region'],
            'severity': severity,
            'recommended_action': 'Route to processing or storage' if severity in ('high', 'medium') else (
                'Urgent procurement needed' if severity == 'shortage' else 'Market balanced'),
        })

    radar.sort(key=lambda r: abs(r['delta']), reverse=True)

    summary = {
        'total_surplus_qty': sum(max(r['delta'], 0) for r in radar),
        'total_shortage_qty': sum(abs(min(r['delta'], 0)) for r in radar),
        'expiring_total': sum(r['expiring_quantity'] for r in radar),
        'total_crops_tracked': len(radar),
        'high_severity_count': sum(1 for r in radar if r['severity'] == 'high'),
        'shortage_count': sum(1 for r in radar if r['severity'] == 'shortage'),
    }

    return jsonify({
        'success': True,
        'data': {
            'horizon_days': horizon,
            'radar_items': radar,
            'summary': summary,
            'generated_at': today.isoformat(),
        }
    }), 200


@surplus_bp.route('/opportunities', methods=['GET'])
def surplus_opportunities():
    today = date.today()
    cutoff = today + timedelta(days=7)
    batches = ProduceBatch.query.filter(
        ProduceBatch.status.in_(['available', 'decision_ready']),
        ProduceBatch.availability_end <= cutoff,
    ).order_by(ProduceBatch.availability_end.asc()).all()

    value_sum = sum(b.quantity * 25 for b in batches)
    return jsonify({
        'success': True,
        'data': {
            'opportunities': [
                {**b.to_dict(),
                 'estimated_value': b.quantity * 25,
                 'days_to_expiry': (b.availability_end - today).days if b.availability_end else None,
                 } for b in batches
            ],
            'total_recoverable_value': value_sum,
            'total_quantity_at_risk': sum(b.quantity for b in batches),
        }
    }), 200
