from django.urls import path

from .views import DashboardView, ExportView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='analytics-dashboard'),
    path('export/', ExportView.as_view(), name='analytics-export'),
]
