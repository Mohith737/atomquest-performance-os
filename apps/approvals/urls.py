from django.urls import path

from .views import ApproveGoalView, PendingApprovalsView, RejectGoalView

urlpatterns = [
    path('pending/', PendingApprovalsView.as_view(), name='pending-approvals'),
    path('<uuid:goal_id>/approve/', ApproveGoalView.as_view(), name='approve-goal'),
    path('<uuid:goal_id>/reject/', RejectGoalView.as_view(), name='reject-goal'),
]
