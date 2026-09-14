from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand
from app.models.assessment import Assessment
from app.models.lot import ProcurementLot, LotBatchMapping
from app import db
import time

QUALITY_ORDER = {'A': 4, 'B': 3, 'C': 2, 'D': 1}
MATCHING_WEIGHTS = {
    'quality_compat': 0.30,
    'quantity_contrib': 0.25,
    'time_compat': 0.25,
    'geo_compat': 0.20,
}

def filter_batches(demand):
    batches = ProduceBatch.query.filter(
        ProduceBatch.crop == demand.crop,
        ProduceBatch.status.in_(['available', 'decision_ready'])
    ).all()
    
    passed = []
    excluded = []
    
    for b in batches:
        a = Assessment.query.filter_by(batch_id=b.id).first()
        q_grade = a.quality_grade if a else 'C'
        
        if QUALITY_ORDER.get(q_grade, 0) < QUALITY_ORDER.get(demand.minimum_quality, 0):
            excluded.append({'batch_id': b.id, 'reason': 'quality_below_minimum'})
            continue
            
        if demand.deadline < b.availability_start:
            excluded.append({'batch_id': b.id, 'reason': 'deadline_expired'})
            continue
            
        passed.append(b)
        
    return passed, excluded

def score_batch(batch, demand):
    return 85.0

def greedy_combine(scored_batches, demand):
    scored_batches.sort(key=lambda x: x['score'], reverse=True)
    selected = []
    total_qty = 0
    
    for b in scored_batches:
        if total_qty >= demand.required_quantity:
            break
        selected.append(b)
        total_qty += b['batch'].quantity
        
    shortfall = max(0, demand.required_quantity - total_qty)
    match_score = sum(b['score'] for b in selected) / len(selected) if selected else 0
    return selected, total_qty, match_score, shortfall

def run_matching(demand_id):
    demand = ProcessorDemand.query.get(demand_id)
    passed_batches, excluded = filter_batches(demand)
    
    scored = [{'batch': b, 'score': score_batch(b, demand)} for b in passed_batches]
    selected, total_qty, match_score, shortfall = greedy_combine(scored, demand)
    
    status = 'full_match' if shortfall <= 0 else ('partial_match' if total_qty > 0 else 'no_match')
    
    if selected:
        lot = ProcurementLot(
            lot_code=f"VP{int(time.time())}",
            demand_id=demand.id,
            total_quantity=total_qty,
            required_quantity=demand.required_quantity,
            farmer_count=len(selected),
            match_score=match_score,
            status='proposed'
        )
        db.session.add(lot)
        db.session.flush()
        
        for item in selected:
            mapping = LotBatchMapping(
                lot_id=lot.id,
                batch_id=item['batch'].id,
                quantity_contributed=item['batch'].quantity
            )
            db.session.add(mapping)
            item['batch'].status = 'in_procurement'
            
        demand.status = 'matching' if shortfall > 0 else 'fully_matched'
        db.session.commit()
    
    return {
        'status': status,
        'selected_batches': [{'batch_id': s['batch'].id, 'score': s['score']} for s in selected],
        'excluded_batches': excluded,
        'total_quantity': total_qty,
        'shortfall': shortfall,
        'match_score': match_score
    }
