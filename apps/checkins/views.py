from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.audit import log_audit
from apps.core.permissions import IsManagerOrAdmin

from .models import CheckIn
from .serializers import CheckInCreateSerializer, CheckInSerializer, ManagerCommentSerializer


class CheckInViewSet(viewsets.ModelViewSet):
    queryset = CheckIn.objects.select_related('goal', 'submitted_by')
    serializer_class = CheckInSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'employee':
            queryset = queryset.filter(goal__owner=user)
        elif user.role == 'manager':
            queryset = queryset.filter(goal__owner__manager=user)
        goal_id = self.request.query_params.get('goal')
        if goal_id:
            queryset = queryset.filter(goal_id=goal_id)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return CheckInCreateSerializer
        return CheckInSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        checkin = serializer.save()
        output = CheckInSerializer(checkin, context=self.get_serializer_context())
        return Response(output.data, status=201)

    @action(detail=True, methods=['patch'], url_path='comment', permission_classes=[IsManagerOrAdmin])
    def comment(self, request, pk=None):
        checkin = self.get_object()
        serializer = ManagerCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_value = {'manager_comment': checkin.manager_comment}
        checkin.manager_comment = serializer.validated_data['manager_comment']
        checkin.save(update_fields=['manager_comment'])
        log_audit(
            actor=request.user,
            action='MANAGER_COMMENT_ADDED',
            target_model='CheckIn',
            target_id=checkin.id,
            old_value=old_value,
            new_value={'manager_comment': checkin.manager_comment},
            request=request,
        )
        return Response(CheckInSerializer(checkin, context=self.get_serializer_context()).data)
