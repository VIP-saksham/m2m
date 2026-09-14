from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=True)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), nullable=False) # farmer/buyer/processor/fpo/admin
    business_name = db.Column(db.String(200), nullable=True)
    location = db.Column(db.String(300), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    district = db.Column(db.String(100), nullable=True)
    village = db.Column(db.String(200), nullable=True)
    preferred_language = db.Column(db.String(10), default='en')
    fpo_name = db.Column(db.String(200), nullable=True)
    processing_category = db.Column(db.String(200), nullable=True)
    avatar_path = db.Column(db.String(500), nullable=True)
    # Google Sign-In subject (the `sub` claim of a verified Google ID token).
    google_sub = db.Column(db.String(255), unique=True, nullable=True, index=True)
    verification_status = db.Column(db.String(50), default='unverified')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'business_name': self.business_name,
            'location': self.location,
            'state': self.state,
            'district': self.district,
            'village': self.village,
            'preferred_language': self.preferred_language,
            'fpo_name': self.fpo_name,
            'processing_category': self.processing_category,
            'avatar_path': self.avatar_path,
            'google_linked': bool(self.google_sub),
            'needs_role': self.role in (None, ''),
            'verification_status': self.verification_status,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
