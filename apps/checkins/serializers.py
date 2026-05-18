from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.core.audit import log_audit
from apps.goals.models import SharedGoalLink

from .models import CheckIn


class CheckInSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)

    class Meta:
        model = CheckIn
        fields = '__all__'


class CheckInCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = ['goal', 'progress_value', 'notes']

    def validate_goal(self, value):
        if value.status != 'approved':
            raise serializers.ValidationError('Check-ins are allowed only for approved goals.')
        return value

    def validate(self, attrs):
        goal = attrs['goal']
        user = self.context['request'].user
        is_owner = goal.owner_id == user.id
        is_linked_owner = SharedGoalLink.objects.filter(
            primary_goal=goal,
            linked_goal__owner=user,
        ).exists()
        if not is_owner and not is_linked_owner:
            raise serializers.ValidationError('You can submit check-ins only for your own or linked goals.')
        return attrs

    def create(self, validated_data):
        actor = self.context['request'].user
        goal = validated_data['goal']
        old_progress = goal.progress
        progress_value = validated_data['progress_value']

        checkin = CheckIn.objects.create(**validated_data, submitted_by=actor)

        goal.progress = progress_value
        goal.save(update_fields=['progress'])

        for link in SharedGoalLink.objects.filter(primary_goal=goal, sync_progress=True):
            link.linked_goal.progress = progress_value
            link.linked_goal.save(update_fields=['progress'])

        log_audit(
            actor=actor,
            action='CHECKIN_SUBMITTED',
            target_model='CheckIn',
            target_id=checkin.id,
            old_value={'progress': old_progress},
            new_value={'progress': progress_value},
            request=self.context.get('request'),
        )
        return checkin


class ManagerCommentSerializer(serializers.Serializer):
    manager_comment = serializers.CharField(required=True, min_length=1)
