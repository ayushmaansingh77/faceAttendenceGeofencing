from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class UserRecord:
    id: int
    name: str
    email: str
    password_hash: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    has_face_enrolled: bool = False


@dataclass
class ZoneRecord:
    id: int
    name: str
    center_lat: float
    center_lng: float
    radius_meters: float
    is_active: bool
    created_at: Optional[datetime] = None


@dataclass
class AttendanceRecordView:
    id: int
    user_id: int
    user_name: str
    check_in_at: datetime
    check_in_zone_name: Optional[str]
    check_out_at: Optional[datetime]
    check_out_zone_name: Optional[str]


@dataclass
class AttendanceSession:
    """Full internal shape of one check-in/check-out pair (open/close row)."""

    id: int
    user_id: int
    check_in_at: datetime
    check_in_lat: float
    check_in_lng: float
    check_in_zone_id: Optional[int]
    check_in_similarity: float
    check_out_at: Optional[datetime] = None
    check_out_lat: Optional[float] = None
    check_out_lng: Optional[float] = None
    check_out_zone_id: Optional[int] = None
    check_out_similarity: Optional[float] = None
