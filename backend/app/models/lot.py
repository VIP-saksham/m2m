from datetime import datetime
from app import db

class ProcurementLot(db.Model):
    __tablename__ = 'procurement_lots'
    
    id = db.Column(db.Integer, primary_key=True)
    lot_code = db.Column(db.String(100), unique=True, nullable=False)
    demand_id = db.Column(db.Integer, db.ForeignKey('processor_demands.id'), nullable=False)
    total_quantity = db.Column(db.Float, nullable=False)
    required_quantity = db.Column(db.Float, nullable=False)
    farmer_count = db.Column(db.Integer, nullable=False)
    quality_summary = db.Column(db.String(50), nullable=True)
    match_score = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), default='proposed')
    notes = db.Column(db.Text, nullable=True)
    processor_notes = db.Column(db.Text, nullable=True)
    algorithm_details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    mappings = db.relationship('LotBatchMapping', backref='lot', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'lot_code': self.lot_code,
            'demand_id': self.demand_id,
            'total_quantity': self.total_quantity,
            'required_quantity': self.required_quantity,
            'farmer_count': self.farmer_count,
            'quality_summary': self.quality_summary,
            'match_score': self.match_score,
            'status': self.status,
            'notes': self.notes,
            'processor_notes': self.processor_notes,
            'algorithm_details': self.algorithm_details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class LotBatchMapping(db.Model):
    __tablename__ = 'lot_batch_mappings'
    
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('procurement_lots.id'), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('produce_batches.id'), nullable=False)
    quantity_contributed = db.Column(db.Float, nullable=False)
    farmer_response = db.Column(db.String(20), default='pending') # pending/accepted/declined
    farmer_response_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'lot_id': self.lot_id,
            'batch_id': self.batch_id,
            'quantity_contributed': self.quantity_contributed,
            'farmer_response': self.farmer_response,
            'farmer_response_at': self.farmer_response_at.isoformat() if self.farmer_response_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
