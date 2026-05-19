from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Goal
from .validators import validate_transition, validate_weightage_sum


class GoalSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    approvals = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'is_locked', 'quarter', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance
        next_status = attrs.get('status')
        is_completion_transition = (
            instance
            and instance.is_locked
            and instance.status == 'approved'
            and next_status == 'completed'
            and set(attrs.keys()) == {'status'}
        )
        if instance and instance.is_locked and not is_completion_transition:
            raise serializers.ValidationError('Locked goals cannot be modified.')

        if instance and next_status and next_status != instance.status:
            try:
                validate_transition(instance.status, next_status)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'status': exc.messages}) from exc

        return attrs

    def get_approvals(self, obj):
        approvals = obj.approvals.select_related('reviewed_by').order_by('-created_at')
        return [
            {
                'id': approval.id,
                'action': approval.action,
                'comment': approval.comment,
                'created_at': approval.created_at,
                'reviewed_by': UserSerializer(approval.reviewed_by).data,
            }
            for approval in approvals
        ]

    def validate_weightage(self, value):
        owner = self.instance.owner if self.instance else self.context['request'].user
        exclude_id = self.instance.id if self.instance else None
        try:
            validate_weightage_sum(owner, value, exclude_id=exclude_id)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def update(self, instance, validated_data):
        updated = super().update(instance, validated_data)
        if updated.status == 'approved' and not updated.is_locked:
            updated.is_locked = True
            updated.save(update_fields=['is_locked', 'updated_at'])
        return updated


class GoalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['title', 'description', 'goal_type', 'start_date', 'end_date', 'weightage']

    def validate(self, attrs):
        if attrs.get('is_locked'):
            raise serializers.ValidationError('Locked goals cannot be modified.')
        return attrs

    def validate_end_date(self, value):
        start_date = self.initial_data.get('start_date')
        if start_date:
            start_date = serializers.DateField().to_internal_value(start_date)
            if value <= start_date:
                raise serializers.ValidationError('End date must be after start date.')
        return value

    def validate_weightage(self, value):
        try:
            validate_weightage_sum(self.context['request'].user, value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        validated_data['status'] = 'draft'
        return super().create(validated_data)
