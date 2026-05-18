from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.audit import log_audit
from apps.core.permissions import IsManagerOrAdmin
from apps.goals.models import Goal
from apps.goals.serializers import GoalSerializer

from .models import GoalApproval
from .serializers import ApproveSerializer, RejectSerializer


def reviewable_goals_for(user):
    if user.role == 'manager':
        return Goal.objects.filter(owner__manager=user)
    return Goal.objects.all()


class PendingApprovalsView(generics.ListAPIView):
    permission_classes = [IsManagerOrAdmin]
    serializer_class = GoalSerializer

    def get_queryset(self):
        return reviewable_goals_for(self.request.user).filter(status='pending')


class ApproveGoalView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, goal_id):
        serializer = ApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        goal = get_object_or_404(reviewable_goals_for(request.user), id=goal_id)
        if goal.status != 'pending':
            return Response({'detail': 'Only pending goals can be approved.'}, status=status.HTTP_400_BAD_REQUEST)

        old_value = {'status': goal.status}
        goal.status = 'approved'
        goal.is_locked = True
        goal.save(update_fields=['status', 'is_locked', 'quarter', 'updated_at'])

        GoalApproval.objects.create(
            goal=goal,
            reviewed_by=request.user,
            action='approved',
            comment=serializer.validated_data.get('comment', ''),
        )
        log_audit(
            actor=request.user,
            action='GOAL_APPROVED',
            target_model='Goal',
            target_id=goal.id,
            old_value=old_value,
            new_value={'status': 'approved', 'is_locked': True},
            request=request,
        )
        return Response(GoalSerializer(goal, context={'request': request}).data)


class RejectGoalView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, goal_id):
        serializer = RejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        goal = get_object_or_404(reviewable_goals_for(request.user), id=goal_id)
        if goal.status != 'pending':
            return Response({'detail': 'Only pending goals can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        old_value = {'status': goal.status}
        goal.status = 'rejected'
        goal.save(update_fields=['status', 'quarter', 'updated_at'])

        GoalApproval.objects.create(
            goal=goal,
            reviewed_by=request.user,
            action='rejected',
            comment=serializer.validated_data['comment'],
        )
        log_audit(
            actor=request.user,
            action='GOAL_REJECTED',
            target_model='Goal',
            target_id=goal.id,
            old_value=old_value,
            new_value={'status': 'rejected'},
            request=request,
        )
        return Response(GoalSerializer(goal, context={'request': request}).data)
