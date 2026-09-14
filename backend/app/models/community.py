from datetime import datetime
from app import db


class CommunityConversation(db.Model):
    __tablename__ = 'community_conversations'

    id = db.Column(db.Integer, primary_key=True)
    listing_type = db.Column(db.String(20), nullable=False)
    listing_id = db.Column(db.Integer, nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CommunityMessage(db.Model):
    __tablename__ = 'community_messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('community_conversations.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, current_user_id):
        return {
            'id': self.id,
            'body': self.body,
            'mine': self.sender_id == current_user_id,
            'sender_label': 'You' if self.sender_id == current_user_id else 'Community member',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CommunityLike(db.Model):
    __tablename__ = 'community_likes'

    id = db.Column(db.Integer, primary_key=True)
    listing_type = db.Column(db.String(20), nullable=False)
    listing_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('listing_type', 'listing_id', 'user_id', name='uq_community_like'),)
