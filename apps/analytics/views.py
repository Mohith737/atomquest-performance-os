import csv

from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .utils import build_dashboard_stats, scoped_goals_for


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard_stats(request.user))


class ExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="goals_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['Goal Title', 'Owner', 'Status', 'Progress', 'Quarter', 'Weightage'])

        goals = scoped_goals_for(request.user).select_related('owner').order_by('created_at')
        for goal in goals:
            writer.writerow([
                goal.title,
                goal.owner.full_name,
                goal.status,
                goal.progress,
                goal.quarter,
                goal.weightage,
            ])

        return response
