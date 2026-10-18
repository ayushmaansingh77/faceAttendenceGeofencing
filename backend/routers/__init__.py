from .views import router as views_router
from .face import router as face_router
from .auth import router as auth_router
from .admin import router as admin_router
from .attendance import router as attendance_router

__all__ = [
    "views_router",
    "face_router",
    "auth_router",
    "admin_router",
    "attendance_router",
]
