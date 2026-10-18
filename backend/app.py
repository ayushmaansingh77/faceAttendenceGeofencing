from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from config import ALLOWED_ORIGINS, STORAGE_BACKEND
from db import init_storage
from db.seed_admin import ensure_first_admin
from rate_limit import limiter
from routers import admin_router, attendance_router, auth_router, face_router, views_router
from services import face_service

# Base64-encoded webcam JPEG snapshots plus JSON overhead comfortably fit
# well under this; it exists to block oversized-body memory-exhaustion
# attempts against /api/face/enroll and the attendance endpoints.
MAX_BODY_BYTES = 8 * 1024 * 1024


class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None and int(content_length) > MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"detail": "Request body too large."})
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager to preload ML models and prepare storage at server startup."""
    print("Preloading Face Recognition model...")
    face_service.initialize_model()

    print(f"Preparing storage (backend={STORAGE_BACKEND})...")
    # Postgres: create_all() only creates missing tables, it never alters
    # existing ones — fine for a from-scratch prototype, introduce Alembic if
    # the schema needs to evolve on a live database later. JSON: no-op, the
    # file is created lazily on first write.
    init_storage()
    ensure_first_admin()

    yield
    print("Application shutdown.")


app = FastAPI(
    title="Face Recognition Attendance System",
    description="FastAPI backend for admin/employee auth, face-verified attendance, and geofencing.",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(MaxBodySizeMiddleware)

# CORS restricted to explicit origins (config.ALLOWED_ORIGINS) — never "*"
# together with allow_credentials=True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers first so /api/* is never swallowed by the SPA catch-all
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(face_router)
app.include_router(attendance_router)
app.include_router(views_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
