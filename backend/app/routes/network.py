from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand
from app.models.lot import ProcurementLot, LotBatchMapping
from collections import defaultdict
from datetime import datetime, timedelta

network_bp = Blueprint('network', __name__)


@network_bp.route('/overview', methods=['GET'])
def network_overview():
    users = User.query.filter_by(is_active=True).all()
    farmers = [u for u in users if u.role == 'farmer']
    processors = [u for u in users if u.role in ('processor', 'buyer')]
    admins = [u for u in users if u.role == 'admin']

    states = defaultdict(lambda: {'farmers': 0, 'processors': 0, 'batches': 0})
    for u in users:
        key = u.state or u.district or 'Unspecified'
        if u.role == 'farmer':
            states[key]['farmers'] += 1
        elif u.role in ('processor', 'buyer'):
            states[key]['processors'] += 1

    batches = ProduceBatch.query.all()
    for b in batches:
        f = User.query.get(b.farmer_id)
        key = (f.state or f.district or 'Unspecified') if f else 'Unspecified'
        states[key]['batches'] += 1

    regions = []
    for name, s in states.items():
        total = s['farmers'] + s['processors']
        if total > 0:
            regions.append({
                'region': name,
                'farmers': s['farmers'],
                'processors': s['processors'],
                'batches': s['batches'],
                'network_density': round(min(total / 5, 1.0), 2),
            })
    regions.sort(key=lambda r: r['farmers'] + r['processors'], reverse=True)

    return jsonify({
        'success': True,
        'data': {
            'network': {
                'total_users': len(users),
                'farmers': len(farmers),
                'processors': len(processors),
                'admins': len(admins),
                'total_batches': ProduceBatch.query.count(),
                'total_demands': ProcessorDemand.query.count(),
                'total_lots': ProcurementLot.query.count(),
                'confirmed_lots': ProcurementLot.query.filter_by(status='confirmed').count(),
            },
            'regions': regions[:20],
            'top_crops': _top_crops(),
            'recent_connections': _recent_connections(),
        }
    }), 200


def _top_crops():
    batches = ProduceBatch.query.all()
    demands = ProcessorDemand.query.all()
    crop_stats = defaultdict(lambda: {'supply': 0, 'demand': 0, 'farmers': set(), 'processors': set()})
    for b in batches:
        crop_stats[b.crop]['supply'] += b.quantity
        crop_stats[b.crop]['farmers'].add(b.farmer_id)
    for d in demands:
        crop_stats[d.crop]['demand'] += d.required_quantity
        crop_stats[d.crop]['processors'].add(d.processor_id)
    top = []
    for crop, s in crop_stats.items():
        top.append({
            'crop': crop,
            'supply': s['supply'],
            'demand': s['demand'],
            'farmers_count': len(s['farmers']),
            'processors_count': len(s['processors']),
        })
    top.sort(key=lambda x: x['supply'] + x['demand'], reverse=True)
    return top[:8]


def _recent_connections():
    lots = ProcurementLot.query.order_by(ProcurementLot.created_at.desc()).limit(8).all()
    connections = []
    for l in lots:
        demand = ProcessorDemand.query.get(l.demand_id)
        processor = User.query.get(demand.processor_id) if demand else None
        mappings = LotBatchMapping.query.filter_by(lot_id=l.id).all()
        farmer_ids = set()
        for m in mappings:
            b = ProduceBatch.query.get(m.batch_id)
            if b:
                farmer_ids.add(b.farmer_id)
        connections.append({
            'id': f'conn-{l.id}',
            'type': 'procurement_lot',
            'lot_id': l.id,
            'lot_code': l.lot_code,
            'processor_name': processor.name if processor else 'Unknown',
            'farmers_count': len(farmer_ids),
            'quantity': l.total_quantity,
            'status': l.status,
            'created_at': l.created_at.isoformat() if l.created_at else None,
        })
    return connections


@network_bp.route('/participants', methods=['GET'])
def participants():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    verified_only = request.args.get('verified') == 'true'
    search = request.args.get('q')

    query = User.query.filter(User.role.in_(['farmer', 'processor', 'buyer']))
    if role:
        query = query.filter_by(role=role)
    if verified_only:
        query = query.filter_by(verification_status='verified')
    if search:
        like = f'%{search}%'
        query = query.filter(
            (User.name.like(like)) | (User.location.like(like)) | (User.state.like(like))
        )
    query = query.filter_by(is_active=True).order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    data = []
    for u in pagination.items:
        if u.role == 'farmer':
            count = ProduceBatch.query.filter_by(farmer_id=u.id).count()
        else:
            count = ProcessorDemand.query.filter_by(processor_id=u.id).count()
        d = u.to_dict()
        d['activity_count'] = count
        data.append(d)

    return jsonify({
        'success': True,
        'data': data,
        'meta': {'total': pagination.total, 'page': page, 'per_page': per_page, 'pages': pagination.pages}
    }), 200
