"""
Postgres/SQLAlchemy storage backend. Same method interface as
db/json_store.py's JsonStore — see that module's docstring. Selected when
STORAGE_BACKEND=postgres.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from .database import Base, SessionLocal, engine
from .models import AttendanceRecord, FaceEmbedding, GeofenceZone, User
from .records import AttendanceRecordView, AttendanceSession, UserRecord, ZoneRecord


def _to_user_record(u: User) -> UserRecord:
    return UserRecord(
        id=u.id,
        name=u.name,
        email=u.email,
        password_hash=u.password_hash,
        role=u.role,
        is_active=u.is_active,
        created_at=u.created_at,
        has_face_enrolled=u.face_embedding is not None,
    )


def _to_zone_record(z: GeofenceZone) -> ZoneRecord:
    return ZoneRecord(
        id=z.id,
        name=z.name,
        center_lat=z.center_lat,
        center_lng=z.center_lng,
        radius_meters=z.radius_meters,
        is_active=z.is_active,
        created_at=z.created_at,
    )


def _to_session(r: AttendanceRecord) -> AttendanceSession:
    return AttendanceSession(
        id=r.id,
        user_id=r.user_id,
        check_in_at=r.check_in_at,
        check_in_lat=r.check_in_lat,
        check_in_lng=r.check_in_lng,
        check_in_zone_id=r.check_in_zone_id,
        check_in_similarity=r.check_in_similarity,
        check_out_at=r.check_out_at,
        check_out_lat=r.check_out_lat,
        check_out_lng=r.check_out_lng,
        check_out_zone_id=r.check_out_zone_id,
        check_out_similarity=r.check_out_similarity,
    )


def _to_attendance_view(r: AttendanceRecord) -> AttendanceRecordView:
    return AttendanceRecordView(
        id=r.id,
        user_id=r.user_id,
        user_name=r.user.name,
        check_in_at=r.check_in_at,
        check_in_zone_name=r.check_in_zone.name if r.check_in_zone else None,
        check_out_at=r.check_out_at,
        check_out_zone_name=r.check_out_zone.name if r.check_out_zone else None,
    )


class SqlStore:
    def init_tables(self) -> None:
        Base.metadata.create_all(bind=engine)

    # -- users -----------------------------------------------------------
    def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        db = SessionLocal()
        try:
            u = db.query(User).filter(User.email == email).first()
            return _to_user_record(u) if u else None
        finally:
            db.close()

    def get_user_by_id(self, user_id: int) -> Optional[UserRecord]:
        db = SessionLocal()
        try:
            u = db.query(User).filter(User.id == user_id).first()
            return _to_user_record(u) if u else None
        finally:
            db.close()

    def create_user(self, name: str, email: str, password_hash: str, role: str) -> UserRecord:
        db = SessionLocal()
        try:
            u = User(name=name, email=email, password_hash=password_hash, role=role, is_active=True)
            db.add(u)
            db.commit()
            db.refresh(u)
            return _to_user_record(u)
        finally:
            db.close()

    def list_employees(self) -> List[UserRecord]:
        db = SessionLocal()
        try:
            users = db.query(User).filter(User.role == "employee").order_by(User.created_at.desc()).all()
            return [_to_user_record(u) for u in users]
        finally:
            db.close()

    def count_admins(self) -> int:
        db = SessionLocal()
        try:
            return db.query(User).filter(User.role == "admin").count()
        finally:
            db.close()

    def set_user_active(self, user_id: int, is_active: bool) -> Optional[UserRecord]:
        db = SessionLocal()
        try:
            u = db.query(User).filter(User.id == user_id, User.role == "employee").first()
            if not u:
                return None
            u.is_active = is_active
            db.commit()
            db.refresh(u)
            return _to_user_record(u)
        finally:
            db.close()

    def delete_user(self, user_id: int) -> bool:
        db = SessionLocal()
        try:
            u = db.query(User).filter(User.id == user_id, User.role == "employee").first()
            if not u:
                return False
            db.delete(u)
            db.commit()
            return True
        finally:
            db.close()

    # -- face embeddings ---------------------------------------------------
    def get_embedding(self, user_id: int) -> Optional[List[float]]:
        db = SessionLocal()
        try:
            fe = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).first()
            return fe.embedding if fe else None
        finally:
            db.close()

    def upsert_embedding(self, user_id: int, embedding: List[float]) -> str:
        db = SessionLocal()
        try:
            existing = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).first()
            if existing:
                db.delete(existing)
                db.flush()
            fe = FaceEmbedding(user_id=user_id, embedding=embedding)
            db.add(fe)
            db.commit()
            db.refresh(fe)
            return fe.enrolled_at.isoformat()
        finally:
            db.close()

    def list_all_embeddings(self) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            rows = db.query(FaceEmbedding).all()
            return [{"user_id": r.user_id, "name": r.user.name, "embedding": r.embedding} for r in rows]
        finally:
            db.close()

    # -- geofence zones ------------------------------------------------
    def list_zones(self, active_only: bool = False) -> List[ZoneRecord]:
        db = SessionLocal()
        try:
            q = db.query(GeofenceZone)
            if active_only:
                q = q.filter(GeofenceZone.is_active == True)  # noqa: E712
            zones = q.order_by(GeofenceZone.created_at.desc()).all()
            return [_to_zone_record(z) for z in zones]
        finally:
            db.close()

    def get_zone(self, zone_id: int) -> Optional[ZoneRecord]:
        db = SessionLocal()
        try:
            z = db.query(GeofenceZone).filter(GeofenceZone.id == zone_id).first()
            return _to_zone_record(z) if z else None
        finally:
            db.close()

    def create_zone(self, name: str, center_lat: float, center_lng: float, radius_meters: float, is_active: bool, created_by: Optional[int]) -> ZoneRecord:
        db = SessionLocal()
        try:
            z = GeofenceZone(
                name=name, center_lat=center_lat, center_lng=center_lng,
                radius_meters=radius_meters, is_active=is_active, created_by=created_by,
            )
            db.add(z)
            db.commit()
            db.refresh(z)
            return _to_zone_record(z)
        finally:
            db.close()

    def update_zone(self, zone_id: int, updates: Dict[str, Any]) -> Optional[ZoneRecord]:
        db = SessionLocal()
        try:
            z = db.query(GeofenceZone).filter(GeofenceZone.id == zone_id).first()
            if not z:
                return None
            for k, v in updates.items():
                setattr(z, k, v)
            db.commit()
            db.refresh(z)
            return _to_zone_record(z)
        finally:
            db.close()

    def delete_zone(self, zone_id: int) -> bool:
        db = SessionLocal()
        try:
            z = db.query(GeofenceZone).filter(GeofenceZone.id == zone_id).first()
            if not z:
                return False
            db.delete(z)
            db.commit()
            return True
        finally:
            db.close()

    # -- attendance ------------------------------------------------------
    def get_open_session(self, user_id: int) -> Optional[AttendanceSession]:
        db = SessionLocal()
        try:
            r = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.user_id == user_id, AttendanceRecord.check_out_at.is_(None))
                .order_by(AttendanceRecord.check_in_at.desc())
                .first()
            )
            return _to_session(r) if r else None
        finally:
            db.close()

    def create_attendance(self, user_id: int, check_in_at: datetime, lat: float, lng: float, zone_id: Optional[int], similarity: float) -> AttendanceSession:
        db = SessionLocal()
        try:
            r = AttendanceRecord(
                user_id=user_id, check_in_at=check_in_at, check_in_lat=lat, check_in_lng=lng,
                check_in_zone_id=zone_id, check_in_similarity=similarity,
            )
            db.add(r)
            db.commit()
            db.refresh(r)
            return _to_session(r)
        finally:
            db.close()

    def close_attendance(self, record_id: int, check_out_at: datetime, lat: float, lng: float, zone_id: Optional[int], similarity: float) -> AttendanceSession:
        db = SessionLocal()
        try:
            r = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
            if not r:
                raise ValueError(f"Attendance record {record_id} not found")
            r.check_out_at = check_out_at
            r.check_out_lat = lat
            r.check_out_lng = lng
            r.check_out_zone_id = zone_id
            r.check_out_similarity = similarity
            db.commit()
            db.refresh(r)
            return _to_session(r)
        finally:
            db.close()

    def list_attendance(
        self,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AttendanceRecordView]:
        db = SessionLocal()
        try:
            q = db.query(AttendanceRecord)
            if user_id is not None:
                q = q.filter(AttendanceRecord.user_id == user_id)
            if date_from is not None:
                q = q.filter(AttendanceRecord.check_in_at >= date_from)
            if date_to is not None:
                q = q.filter(AttendanceRecord.check_in_at <= date_to)
            rows = q.order_by(AttendanceRecord.check_in_at.desc()).offset(offset).limit(limit).all()
            return [_to_attendance_view(r) for r in rows]
        finally:
            db.close()

    def list_my_attendance(self, user_id: int) -> List[AttendanceRecordView]:
        return self.list_attendance(user_id=user_id, limit=1000)


sql_store = SqlStore()
