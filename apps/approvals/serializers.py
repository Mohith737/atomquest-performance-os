from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import GoalApproval


class GoalApprovalSerializer(serializers.ModelSerializer):
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = GoalApproval
        fields = '__all__'


class ApproveSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)


class RejectSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, min_length=10)
