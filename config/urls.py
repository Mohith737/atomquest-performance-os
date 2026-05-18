from django.urls import include, path

urlpatterns = [
    path('api/auth/', include('apps.accounts.urls')),
    path('api/goals/', include('apps.goals.urls')),
    path('api/approvals/', include('apps.approvals.urls')),
    path('api/checkins/', include('apps.checkins.urls')),
    path('api/audit-logs/', include('apps.audit.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]
