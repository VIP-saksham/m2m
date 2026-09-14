from app.models.audit import AuditLog
from app import db

class AuditService:
    @staticmethod
    def log(actor_id, action, entity_type, entity_id=None, metadata=None, ip_address=None):
        log_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            meta_data=metadata,
            ip_address=ip_address
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry

def log_audit(actor_id, action, entity_type, entity_id=None, metadata=None, ip_address=None):
    return AuditService.log(actor_id, action, entity_type, entity_id, metadata, ip_address)
