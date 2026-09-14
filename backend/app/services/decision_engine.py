from app.models.decision import DecisionResult
from app.models.batch import ProduceBatch
from app.models.assessment import Assessment
from app.models.demand import ProcessorDemand
from app import db

QUALITY_GRADES = {'A': 4, 'B': 3, 'C': 2, 'D': 1}
SPOILAGE_RISK_MAP = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
MATURITY_MAP = {'low': 1, 'medium': 2, 'high': 3, 'overripe': 4}

def calculate_sell_score(batch, assessment):
    score = 70
    quality = QUALITY_GRADES.get(assessment.quality_grade, 2)
    score += (quality - 2) * 10
    
    spoilage = SPOILAGE_RISK_MAP.get(assessment.spoilage_risk, 2)
    score -= (spoilage - 1) * 10
    
    return max(0, min(100, score))

def calculate_store_score(batch, assessment):
    score = 60
    spoilage = SPOILAGE_RISK_MAP.get(assessment.spoilage_risk, 2)
    score -= (spoilage - 1) * 15
    
    maturity = MATURITY_MAP.get(assessment.maturity, 2)
    score -= (maturity - 1) * 10
    
    return max(0, min(100, score))

def calculate_process_score(batch, assessment, active_demands):
    score = 50
    if not active_demands:
        return min(30, score)
        
    spoilage = SPOILAGE_RISK_MAP.get(assessment.spoilage_risk, 2)
    maturity = MATURITY_MAP.get(assessment.maturity, 2)
    
    if spoilage >= 3 or maturity >= 3:
        score += 30
        
    quality = QUALITY_GRADES.get(assessment.quality_grade, 2)
    score -= (quality - 2) * 5
    
    return max(0, min(100, score))

def run_decision_engine(batch_id):
    batch = ProduceBatch.query.get(batch_id)
    assessment = Assessment.query.filter_by(batch_id=batch_id).first()
    if not batch or not assessment:
        return None
    
    active_demands = ProcessorDemand.query.filter(
        ProcessorDemand.crop == batch.crop,
        ProcessorDemand.status.in_(['open', 'matching'])
    ).all()
    
    sell = calculate_sell_score(batch, assessment)
    store = calculate_store_score(batch, assessment)
    process = calculate_process_score(batch, assessment, active_demands)
    
    scores = {'SELL': sell, 'STORE': store, 'PROCESS': process}
    recommended = max(scores, key=scores.get)
    
    decision = DecisionResult.query.filter_by(batch_id=batch_id).first()
    if not decision:
        decision = DecisionResult(batch_id=batch_id)
        db.session.add(decision)
        
    decision.sell_score = sell
    decision.store_score = store
    decision.process_score = process
    decision.recommended_action = recommended
    decision.reasons = ["Calculated based on quality, spoilage risk, and market demands"]
    
    batch.status = 'decision_ready'
    db.session.commit()
    
    return decision.to_dict()
