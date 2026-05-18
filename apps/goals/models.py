from uuid import uuid4

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.utils import derive_quarter


STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('completed', 'Completed'),
]


class Goal(models.Model):
    class GoalType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        SHARED = 'shared', 'Shared'

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    goal_type = models.CharField(max_length=20, choices=GoalType.choices, default=GoalType.INDIVIDUAL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_locked = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField()
    quarter = models.CharField(max_length=6)
    progress = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.quarter = derive_quarter(self.start_date)
        super().save(*args, **kwargs)


class SharedGoalLink(models.Model):
    primary_goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='primary_links')
    linked_goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='linked_to')
    sync_progress = models.BooleanField(default=True)

    class Meta:
        unique_together = ('primary_goal', 'linked_goal')
