from datetime import datetime
from app import db

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('produce_batches.id'), unique=True, nullable=False)
    image_path = db.Column(db.String(500), nullable=True)
    maturity = db.Column(db.String(50), nullable=True)
    visible_defects = db.Column(db.String(100), nullable=True)
    appearance = db.Column(db.String(100), nullable=True)
    quality_grade = db.Column(db.String(10), nullable=True)
    spoilage_risk = db.Column(db.String(20), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    assessment_method = db.Column(db.String(50), nullable=True)
    color_score = db.Column(db.Float, nullable=True)
    texture_score = db.Column(db.Float, nullable=True)
    defect_percentage = db.Column(db.Float, nullable=True)
    ai_raw_response = db.Column(db.JSON, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    is_demo = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'batch_id': self.batch_id,
            'image_path': self.image_path,
            'maturity': self.maturity,
            'visible_defects': self.visible_defects,
            'appearance': self.appearance,
            'quality_grade': self.quality_grade,
            'spoilage_risk': self.spoilage_risk,
            'confidence': self.confidence,
            'assessment_method': self.assessment_method,
            'color_score': self.color_score,
            'texture_score': self.texture_score,
            'defect_percentage': self.defect_percentage,
            'ai_raw_response': self.ai_raw_response,
            'notes': self.notes,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
