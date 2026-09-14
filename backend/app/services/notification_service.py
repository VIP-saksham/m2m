from app.models.notification import Notification
from app import db

class NotificationService:
    @staticmethod
    def send(user_id, type_str, title, message, entity_type=None, entity_id=None):
        notif = Notification(
            user_id=user_id,
            type=type_str,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id
        )
        db.session.add(notif)
        db.session.commit()
        return notif
