from datetime import datetime
from app import db

class DecisionResult(db.Model):
    __tablename__ = 'decision_results'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('produce_batches.id'), unique=True, nullable=False)
    sell_score = db.Column(db.Float, nullable=False)
    store_score = db.Column(db.Float, nullable=False)
    process_score = db.Column(db.Float, nullable=False)
    recommended_action = db.Column(db.String(20), nullable=False)
    sell_details = db.Column(db.JSON, nullable=True)
    store_details = db.Column(db.JSON, nullable=True)
    process_details = db.Column(db.JSON, nullable=True)
    reasons = db.Column(db.JSON, nullable=True) # list
    input_snapshot = db.Column(db.JSON, nullable=True)
    engine_version = db.Column(db.String(20), default='1.0')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'batch_id': self.batch_id,
            'sell_score': self.sell_score,
            'store_score': self.store_score,
            'process_score': self.process_score,
            'recommended_action': self.recommended_action,
            'sell_details': self.sell_details,
            'store_details': self.store_details,
            'process_details': self.process_details,
            'reasons': self.reasons,
            'input_snapshot': self.input_snapshot,
            'engine_version': self.engine_version,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
