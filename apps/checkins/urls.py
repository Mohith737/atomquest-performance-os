from rest_framework.routers import DefaultRouter

from .views import CheckInViewSet

router = DefaultRouter()
router.register('', CheckInViewSet, basename='checkin')

urlpatterns = router.urls
