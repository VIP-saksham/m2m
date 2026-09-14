from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.providers.storage_data import get_storage_options

storage_bp = Blueprint('storage', __name__)


@storage_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_storage():
    location = request.args.get('location') or request.args.get('region')
    crop = request.args.get('crop')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    base = get_storage_options(location)

    providers = [
        {
            'id': 1,
            'name': 'North Cold Storage Pvt. Ltd.',
            'type': 'cold_storage',
            'location': location or 'District HQ',
            'state': 'Sample State',
            'capacity_available': 12500,
            'capacity_total': 20000,
            'unit': 'kg',
            'price_per_unit_per_day': 0.35,
            'currency': 'INR',
            'min_duration_days': 7,
            'max_duration_days': 180,
            'supported_crops': ['Tomato', 'Potato', 'Onion', 'Fruits'],
            'rating': 4.5,
            'reviews_count': 128,
            'distance_km': 12,
            'contact_phone': '+91-98000-00001',
            'has_loading_bay': True,
            'has_transport': True,
            'has_insurance': True,
            'temperature_range': {'min_c': 2, 'max_c': 12},
            'humidity_range': {'min_pct': 65, 'max_pct': 90},
            'slug': 'north-cold-storage',
        },
        {
            'id': 2,
            'name': 'AgriVault Warehouse',
            'type': 'warehouse',
            'location': location or 'Suburb',
            'state': 'Sample State',
            'capacity_available': 45000,
            'capacity_total': 80000,
            'unit': 'kg',
            'price_per_unit_per_day': 0.18,
            'currency': 'INR',
            'min_duration_days': 3,
            'max_duration_days': 365,
            'supported_crops': ['Rice', 'Wheat', 'Pulses', 'Cotton', 'Grains'],
            'rating': 4.2,
            'reviews_count': 96,
            'distance_km': 28,
            'contact_phone': '+91-98000-00002',
            'has_loading_bay': True,
            'has_transport': False,
            'has_insurance': True,
            'temperature_range': {'min_c': 15, 'max_c': 28},
            'humidity_range': {'min_pct': 40, 'max_pct': 70},
            'slug': 'agrivault-warehouse',
        },
        {
            'id': 3,
            'name': 'FreshKeep Controlled Atmosphere',
            'type': 'controlled_atmosphere',
            'location': location or 'Industrial Zone',
            'state': 'Sample State',
            'capacity_available': 3200,
            'capacity_total': 5000,
            'unit': 'kg',
            'price_per_unit_per_day': 0.85,
            'currency': 'INR',
            'min_duration_days': 14,
            'max_duration_days': 270,
            'supported_crops': ['Apple', 'Pear', 'Kiwi', 'Tomato Premium'],
            'rating': 4.8,
            'reviews_count': 54,
            'distance_km': 42,
            'contact_phone': '+91-98000-00003',
            'has_loading_bay': True,
            'has_transport': True,
            'has_insurance': True,
            'temperature_range': {'min_c': 0, 'max_c': 5},
            'humidity_range': {'min_pct': 85, 'max_pct': 98},
            'slug': 'freshkeep-ca',
        },
        {
            'id': 4,
            'name': 'Rural Storage Co-op',
            'type': 'silos',
            'location': location or 'Rural Hub',
            'state': 'Sample State',
            'capacity_available': 95000,
            'capacity_total': 150000,
            'unit': 'kg',
            'price_per_unit_per_day': 0.10,
            'currency': 'INR',
            'min_duration_days': 1,
            'max_duration_days': 730,
            'supported_crops': ['Wheat', 'Rice', 'Maize', 'Soybean'],
            'rating': 4.0,
            'reviews_count': 210,
            'distance_km': 55,
            'contact_phone': '+91-98000-00004',
            'has_loading_bay': True,
            'has_transport': False,
            'has_insurance': False,
            'temperature_range': {'min_c': 10, 'max_c': 35},
            'humidity_range': {'min_pct': 30, 'max_pct': 70},
            'slug': 'rural-silos-coop',
        },
    ]

    if crop:
        filtered = [p for p in providers if crop in p['supported_crops']]
        providers = filtered if filtered else providers

    start = (page - 1) * per_page
    paginated = providers[start:start + per_page]

    return jsonify({
        'success': True,
        'data': paginated,
        'meta': {
            'total': len(providers),
            'page': page,
            'per_page': per_page,
            'pages': (len(providers) + per_page - 1) // per_page,
            'location_queried': location,
            'crop_queried': crop,
        }
    }), 200
