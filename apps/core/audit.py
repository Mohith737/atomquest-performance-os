from apps.audit.models import AuditLog
from apps.core.utils import get_client_ip


def log_audit(actor, action, target_model, target_id, old_value=None, new_value=None, request=None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_model=target_model,
        target_id=str(target_id),
        old_value=old_value,
        new_value=new_value,
        ip_address=get_client_ip(request) if request else None,
    )
