from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class SignupRequest(BaseModel):
    """
    Public self-registration. Always creates an "employee" account — there is
    no client-controlled role field, since a role here would let anyone
    self-register as admin. Admin accounts are created only via
    FIRST_ADMIN_* bootstrap (db/seed_admin.py) or by an existing admin
    through POST /api/admin/admins.
    """

    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class UserSummary(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    has_face_enrolled: bool = False


class LoginResponse(BaseModel):
    ok: bool
    token: Optional[str] = None
    user: Optional[UserSummary] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Admin: employee management
# ---------------------------------------------------------------------------
class CreateEmployeeRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class CreateAdminRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class CreateEmployeeResponse(BaseModel):
    ok: bool
    user: Optional[UserSummary] = None
    error: Optional[str] = None


class EmployeeListResponse(BaseModel):
    ok: bool
    employees: List[UserSummary] = []


class SetActiveRequest(BaseModel):
    is_active: bool


# ---------------------------------------------------------------------------
# Face enrollment / recognition
# ---------------------------------------------------------------------------
class EnrollFaceRequest(BaseModel):
    image: str = Field(..., description="Base64 data URL encoded image")


class EnrollFaceResponse(BaseModel):
    ok: bool
    message: Optional[str] = None
    error: Optional[str] = None
    enrolled_at: Optional[str] = None


class RecognizeRequest(BaseModel):
    image: str = Field(..., description="Base64 data URL encoded image to recognize")


class RecognizeResponse(BaseModel):
    ok: bool
    match: bool = False
    name: Optional[str] = None
    user_id: Optional[int] = None
    similarity: Optional[float] = None
    best_similarity: Optional[float] = None
    threshold: Optional[float] = None
    message: Optional[str] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Geofence zones
# ---------------------------------------------------------------------------
class GeofenceZoneCreate(BaseModel):
    name: str = Field(..., min_length=1)
    center_lat: float
    center_lng: float
    radius_meters: float = Field(..., gt=0)
    is_active: bool = True


class GeofenceZoneUpdate(BaseModel):
    name: Optional[str] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius_meters: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None


class GeofenceZoneOut(BaseModel):
    id: int
    name: str
    center_lat: float
    center_lng: float
    radius_meters: float
    is_active: bool
    created_at: Optional[datetime] = None


class GeofenceZoneListResponse(BaseModel):
    ok: bool
    zones: List[GeofenceZoneOut] = []


class GeofenceZoneResponse(BaseModel):
    ok: bool
    zone: Optional[GeofenceZoneOut] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------
class CheckRequest(BaseModel):
    image: str = Field(..., description="Base64 data URL encoded image")
    lat: float
    lng: float


class AttendanceCheckResponse(BaseModel):
    ok: bool
    message: Optional[str] = None
    error: Optional[str] = None
    record_id: Optional[int] = None
    checked_at: Optional[str] = None
    zone_name: Optional[str] = None
    distance_meters: Optional[float] = None
    similarity: Optional[float] = None


class AttendanceRecordOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    check_in_at: datetime
    check_in_zone_name: Optional[str] = None
    check_out_at: Optional[datetime] = None
    check_out_zone_name: Optional[str] = None


class AttendanceListResponse(BaseModel):
    ok: bool
    records: List[AttendanceRecordOut] = []
