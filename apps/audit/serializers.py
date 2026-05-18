from rest_framework import serializers

from .models import AuditLog


class AuditActorSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField()


class AuditLogSerializer(serializers.ModelSerializer):
    actor = AuditActorSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
