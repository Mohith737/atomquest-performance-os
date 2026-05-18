from uuid import uuid4

from django.conf import settings
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.utils import derive_quarter
from apps.goals.models import Goal


class CheckIn(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='checkins')
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    progress_value = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    notes = models.TextField(validators=[MinLengthValidator(10)])
    manager_comment = models.TextField(blank=True)
    quarter = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.quarter = derive_quarter(timezone.localdate())
        super().save(*args, **kwargs)
