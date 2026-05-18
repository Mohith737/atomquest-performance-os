from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db.models import Sum

from .models import Goal


ALLOWED_TRANSITIONS = {
    'draft': ['pending'],
    'pending': ['approved', 'rejected'],
    'approved': ['completed'],
    'rejected': ['draft'],
}


def validate_transition(current, next_status):
    if next_status not in ALLOWED_TRANSITIONS.get(current, []):
        raise ValidationError(f'Invalid status transition from {current} to {next_status}.')


def validate_weightage_sum(owner, new_weight, exclude_id=None):
    total = (
        Goal.objects.filter(owner=owner, status__in=['draft', 'pending', 'approved'])
        .exclude(id=exclude_id)
        .aggregate(Sum('weightage'))['weightage__sum']
        or Decimal('0')
    )
    if total + new_weight > Decimal('100'):
        raise ValidationError('Total weightage exceeds 100%')
