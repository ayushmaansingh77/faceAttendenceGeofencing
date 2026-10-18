import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend" / "dist"
MODELS_DIR = BASE_DIR / "models"
DB_PATH = Path(os.getenv("DB_PATH", BASE_DIR / "db.json"))

# YuNet Face Detection Configuration
YUNET_MODEL_PATH = Path(
    os.getenv("YUNET_MODEL_PATH", MODELS_DIR / "face_detection_yunet_2023mar.onnx")
)
YUNET_MODEL_URL = os.getenv(
    "YUNET_MODEL_URL",
    "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
)
DETECTION_SCORE_THRESHOLD = float(os.getenv("DETECTION_SCORE_THRESHOLD", 0.6))
DETECTION_NMS_THRESHOLD = float(os.getenv("DETECTION_NMS_THRESHOLD", 0.3))
DETECTION_TOP_K = int(os.getenv("DETECTION_TOP_K", 5000))

# Face Recognition Model Configuration (SFace, cv2.FaceRecognizerSF)
#
# Previously ArcFace/MobileFaceNet (InsightFace's "buffalo_sc" pack), which
# is licensed for non-commercial research use only. SFace comes from the
# same OpenCV Zoo project as the YuNet detector above (Apache-2.0), and is
# used directly via OpenCV's own cv2.FaceRecognizerSF API — see
# services/face_service.py, which no longer runs a raw onnxruntime session
# or hand-rolled landmark alignment; FaceRecognizerSF.alignCrop()/.feature()
# do both, taking YuNet's detection output directly.
RECOGNITION_MODEL_PATH = Path(
    os.getenv("RECOGNITION_MODEL_PATH", MODELS_DIR / "face_recognition_sface_2021dec.onnx")
)
RECOGNITION_MODEL_URL = os.getenv(
    "RECOGNITION_MODEL_URL",
    "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
)

# Face Recognition Matching Threshold (Cosine Similarity via FaceRecognizerSF)
# Higher = stricter (fewer false accepts, more false rejects).
# 0.363 is OpenCV Zoo's own published cosine threshold for SFace on their
# LFW benchmark — a starting point, NOT validated against this app's real
# enrollments. Re-tune against actual usage before relying on it. This is
# not comparable to the old ArcFace threshold (0.45) — different model,
# different similarity distribution.
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", 0.363))

# Storage backend: "json" (flat db.json, no setup needed — the default, for
# local/dev use) or "postgres" (SQLAlchemy models in db/models.py). Both
# implement the same interface (see db/store.py) so routers don't care which
# is active.
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "json")

# Database (Postgres) — only required when STORAGE_BACKEND=postgres
DATABASE_URL = os.getenv("DATABASE_URL")

# Auth / JWT
# No insecure fallback secret: a hardcoded default would be a publicly known
# string (visible in this source file) that lets anyone forge tokens. Fail
# loudly at startup instead, for every storage backend.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set. Set a long random secret string in backend/.env "
        "(see backend/.env.example) before starting the server."
    )
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60 * 8))

# CORS: comma-separated list of allowed origins. Defaults to the Vite dev
# server only — set explicitly in backend/.env for any non-local deployment.
# Never use "*" together with allow_credentials=True in app.py.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

# First-admin bootstrap (see db/seed_admin.py) — set these to auto-create the
# initial admin account on first startup, since admin accounts can otherwise
# only be created by an existing admin.
FIRST_ADMIN_NAME = os.getenv("FIRST_ADMIN_NAME", "Admin")
FIRST_ADMIN_EMAIL = os.getenv("FIRST_ADMIN_EMAIL")
FIRST_ADMIN_PASSWORD = os.getenv("FIRST_ADMIN_PASSWORD")
