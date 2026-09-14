from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.providers.market_data import get_market_data
from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand
from collections import defaultdict

market_bp = Blueprint('market', __name__)


@market_bp.route('/prices', methods=['GET'])
def market_prices():
    crop = request.args.get('crop')
    region = request.args.get('region')
    data = get_market_data(crop, region)

    crops = ['Tomato', 'Potato', 'Onion', 'Rice', 'Wheat', 'Cotton']
    if not crop:
        multi = {}
        for c in crops:
            d = get_market_data(c, region)
            multi[c] = {
                **d,
                'trend_7d': 2.5,
                'region_avg': d['price'] * 1.02,
                'national_avg': d['price'] * 0.95,
            }
        return jsonify({'success': True, 'data': {'prices': multi, 'selected': None}}), 200

    history_7d = []
    base = data['price']
    for i in range(7):
        history_7d.append({
            'date': f'Day-{i+1}',
            'price': round(base * (1 + (0.02 * (i - 3))), 2),
        })

    return jsonify({
        'success': True,
        'data': {
            'crop': crop,
            'region': region or 'Default',
            'current_price': base,
            'currency': data['currency'],
            'unit': 'kg',
            'trend': 'up',
            'change_percent': 2.5,
            'history_7d': history_7d,
            'regional_comparison': [
                {'region': 'North', 'price': round(base * 1.05, 2)},
                {'region': 'South', 'price': round(base * 0.98, 2)},
                {'region': 'East', 'price': round(base * 0.92, 2)},
                {'region': 'West', 'price': round(base * 1.08, 2)},
            ],
            'supply_demand_index': 68,
            'seasonality_advice': f'Market outlook for {crop}: moderate demand expected next week.',
        }
    }), 200


@market_bp.route('/trends', methods=['GET'])
def market_trends():
    batches = ProduceBatch.query.all()
    demands = ProcessorDemand.query.all()

    crop_supply = defaultdict(float)
    for b in batches:
        crop_supply[b.crop] += b.quantity

    crop_demand = defaultdict(float)
    for d in demands:
        crop_demand[d.crop] += d.required_quantity

    crops = sorted(set(list(crop_supply.keys()) + list(crop_demand.keys()) + ['Tomato', 'Potato', 'Onion']))
    trends = []
    for c in crops:
        sup = crop_supply.get(c, 0)
        dem = crop_demand.get(c, 0)
        ratio = sup / dem if dem > 0 else 1
        if ratio < 0.7:
            outlook = 'bullish'
        elif ratio > 1.4:
            outlook = 'bearish'
        else:
            outlook = 'stable'
        trends.append({
            'crop': c,
            'supply_quantity': sup,
            'demand_quantity': dem,
            'supply_demand_ratio': round(ratio, 2),
            'outlook': outlook,
            'estimated_price': 25.0,
            'price_movement': round((ratio - 1) * -10, 1),
        })

    return jsonify({
        'success': True,
        'data': {
            'trends': trends,
            'market_sentiment': 'neutral',
            'total_supply_volume': sum(crop_supply.values()),
            'total_demand_volume': sum(crop_demand.values()),
            'last_updated': None,
        }
    }), 200
