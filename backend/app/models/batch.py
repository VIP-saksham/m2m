from datetime import datetime, date
from app import db

class ProduceBatch(db.Model):
    __tablename__ = 'produce_batches'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_code = db.Column(db.String(100), unique=True, nullable=False)
    farmer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    crop = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg')
    harvest_date = db.Column(db.Date, nullable=False)
    harvest_time = db.Column(db.Time, nullable=True)
    location = db.Column(db.String(300), nullable=True)
    storage_condition = db.Column(db.String(200), nullable=True)
    availability_start = db.Column(db.Date, nullable=False)
    availability_end = db.Column(db.Date, nullable=False)
    initial_quality_estimate = db.Column(db.String(20), nullable=True)
    maturity_level = db.Column(db.String(20), nullable=True)
    visible_defects = db.Column(db.String(100), nullable=True)
    spoilage_signs = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    asking_price_min = db.Column(db.Float, nullable=True)
    asking_price_max = db.Column(db.Float, nullable=True)
    listing_description = db.Column(db.Text, nullable=True)
    image_path = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(50), default='draft')
    is_demo = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        harvest_age_days = (date.today() - self.harvest_date).days if self.harvest_date else 0
        return {
            'id': self.id,
            'batch_code': self.batch_code,
            'farmer_id': self.farmer_id,
            'crop': self.crop,
            'variety': self.variety,
            'quantity': self.quantity,
            'unit': self.unit,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'harvest_time': self.harvest_time.isoformat() if self.harvest_time else None,
            'location': self.location,
            'storage_condition': self.storage_condition,
            'availability_start': self.availability_start.isoformat() if self.availability_start else None,
            'availability_end': self.availability_end.isoformat() if self.availability_end else None,
            'initial_quality_estimate': self.initial_quality_estimate,
            'maturity_level': self.maturity_level,
            'visible_defects': self.visible_defects,
            'spoilage_signs': self.spoilage_signs,
            'notes': self.notes,
            'asking_price_min': self.asking_price_min,
            'asking_price_max': self.asking_price_max,
            'listing_description': self.listing_description,
            'image_path': self.image_path,
            'status': self.status,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'harvest_age_days': harvest_age_days
        }
