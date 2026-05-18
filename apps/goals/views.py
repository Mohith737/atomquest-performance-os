from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.audit import log_audit
from apps.core.permissions import IsManagerOrAdmin

from .models import Goal
from .serializers import GoalCreateSerializer, GoalSerializer
from .validators import validate_transition


class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Goal.objects.filter(owner=user)
        if user.role == 'manager':
            return Goal.objects.filter(owner__manager=user)
        return Goal.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return GoalCreateSerializer
        return GoalSerializer

    def perform_create(self, serializer):
        goal = serializer.save()
        log_audit(
            actor=self.request.user,
            action='GOAL_CREATED',
            target_model='Goal',
            target_id=goal.id,
            new_value={'status': goal.status},
            request=self.request,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        output = GoalSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        goal = self.get_object()
        try:
            validate_transition(goal.status, 'pending')
        except DjangoValidationError as exc:
            return Response({'status': exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        old_status = goal.status
        goal.status = 'pending'
        goal.save(update_fields=['status', 'quarter', 'updated_at'])
        log_audit(
            actor=request.user,
            action='GOAL_SUBMITTED',
            target_model='Goal',
            target_id=goal.id,
            old_value={'status': old_status},
            new_value={'status': goal.status},
            request=request,
        )
        return Response(GoalSerializer(goal, context=self.get_serializer_context()).data)

    @action(detail=False, methods=['get'], permission_classes=[IsManagerOrAdmin])
    def team(self, request):
        if request.user.role == 'manager':
            goals = Goal.objects.filter(owner__manager=request.user)
        else:
            goals = Goal.objects.all()
        serializer = self.get_serializer(goals, many=True)
        return Response(serializer.data)
