from datetime import datetime
from app import db

class ProcessorDemand(db.Model):
    __tablename__ = 'processor_demands'
    
    id = db.Column(db.Integer, primary_key=True)
    demand_code = db.Column(db.String(100), unique=True, nullable=False)
    processor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    crop = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True)
    required_quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    minimum_quality = db.Column(db.String(10), nullable=False)
    deadline = db.Column(db.Date, nullable=False)
    preferred_region = db.Column(db.String(200), nullable=True)
    acceptable_harvest_window = db.Column(db.Integer, default=7)
    processing_category = db.Column(db.String(200), nullable=True)
    offered_price_per_unit = db.Column(db.Float, nullable=True)
    offer_currency = db.Column(db.String(10), default='INR')
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='open')
    is_demo = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'demand_code': self.demand_code,
            'processor_id': self.processor_id,
            'crop': self.crop,
            'variety': self.variety,
            'required_quantity': self.required_quantity,
            'unit': self.unit,
            'minimum_quality': self.minimum_quality,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'preferred_region': self.preferred_region,
            'acceptable_harvest_window': self.acceptable_harvest_window,
            'processing_category': self.processing_category,
            'offered_price_per_unit': self.offered_price_per_unit,
            'offer_currency': self.offer_currency,
            'notes': self.notes,
            'status': self.status,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
