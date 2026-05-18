from uuid import uuid4

from django.conf import settings
from django.db import models

from apps.goals.models import Goal


class GoalApproval(models.Model):
    class Action(models.TextChoices):
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='approvals')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=Action.choices)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
