"""
Flat-JSON storage backend — a drop-in stand-in for the Postgres/SQLAlchemy
backend (SqlStore in db/sql_store.py) so the app can run without a Postgres
instance. Same method interface, same call sites in routers/*.py; swap
back to Postgres by setting STORAGE_BACKEND=postgres in backend/.env.

Not safe for concurrent writers (full read-modify-write on every mutation,
no locking) — fine for local single-process dev/demo use, same tradeoff
the original prototype's services/storage.py had.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import DB_PATH
from db.records import AttendanceRecordView, AttendanceSession, UserRecord, ZoneRecord

_EMPTY_DB = {
    "next_id": {"users": 1, "geofence_zones": 1, "attendance_records": 1},
    "users": [],
    "face_embeddings": {},  # user_id (str) -> {"embedding": [...], "enrolled_at": iso, "updated_at": iso|null}
    "geofence_zones": [],
    "attendance_records": [],
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    return datetime.fromisoformat(value) if value else None


class JsonStore:
    def __init__(self, path: Path = DB_PATH):
        self.path = path

    # -- raw load/save -----------------------------------------------------
    def _load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return json.loads(json.dumps(_EMPTY_DB))
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            return json.loads(json.dumps(_EMPTY_DB))
        for key, default in _EMPTY_DB.items():
            data.setdefault(key, default)
        return data

    def _save(self, data: Dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def _next_id(self, data: Dict[str, Any], collection: str) -> int:
        next_id = data["next_id"].get(collection, 1)
        data["next_id"][collection] = next_id + 1
        return next_id

    # -- users ---------------------------------------------------------
    def _to_user_record(self, u: Dict[str, Any], data: Dict[str, Any]) -> UserRecord:
        return UserRecord(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            password_hash=u["password_hash"],
            role=u["role"],
            is_active=u["is_active"],
            created_at=_parse_dt(u.get("created_at")),
            has_face_enrolled=str(u["id"]) in data["face_embeddings"],
        )

    def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        data = self._load()
        for u in data["users"]:
            if u["email"] == email:
                return self._to_user_record(u, data)
        return None

    def get_user_by_id(self, user_id: int) -> Optional[UserRecord]:
        data = self._load()
        for u in data["users"]:
            if u["id"] == user_id:
                return self._to_user_record(u, data)
        return None

    def create_user(self, name: str, email: str, password_hash: str, role: str) -> UserRecord:
        data = self._load()
        user = {
            "id": self._next_id(data, "users"),
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "is_active": True,
            "created_at": _now_iso(),
        }
        data["users"].append(user)
        self._save(data)
        return self._to_user_record(user, data)

    def list_employees(self) -> List[UserRecord]:
        data = self._load()
        employees = [u for u in data["users"] if u["role"] == "employee"]
        employees.sort(key=lambda u: u.get("created_at") or "", reverse=True)
        return [self._to_user_record(u, data) for u in employees]

    def count_admins(self) -> int:
        data = self._load()
        return sum(1 for u in data["users"] if u["role"] == "admin")

    def set_user_active(self, user_id: int, is_active: bool) -> Optional[UserRecord]:
        data = self._load()
        for u in data["users"]:
            if u["id"] == user_id and u["role"] == "employee":
                u["is_active"] = is_active
                self._save(data)
                return self._to_user_record(u, data)
        return None

    def delete_user(self, user_id: int) -> bool:
        data = self._load()
        before = len(data["users"])
        data["users"] = [u for u in data["users"] if not (u["id"] == user_id and u["role"] == "employee")]
        if len(data["users"]) == before:
            return False
        data["face_embeddings"].pop(str(user_id), None)
        data["attendance_records"] = [r for r in data["attendance_records"] if r["user_id"] != user_id]
        self._save(data)
        return True

    # -- face embeddings -------------------------------------------------
    def get_embedding(self, user_id: int) -> Optional[List[float]]:
        data = self._load()
        entry = data["face_embeddings"].get(str(user_id))
        return entry["embedding"] if entry else None

    def upsert_embedding(self, user_id: int, embedding: List[float]) -> str:
        data = self._load()
        now = _now_iso()
        existing = data["face_embeddings"].get(str(user_id))
        data["face_embeddings"][str(user_id)] = {
            "embedding": embedding,
            "enrolled_at": existing["enrolled_at"] if existing else now,
            "updated_at": now if existing else None,
        }
        self._save(data)
        return now

    def list_all_embeddings(self) -> List[Dict[str, Any]]:
        data = self._load()
        users_by_id = {u["id"]: u for u in data["users"]}
        result = []
        for user_id_str, entry in data["face_embeddings"].items():
            user = users_by_id.get(int(user_id_str))
            if user:
                result.append({"user_id": user["id"], "name": user["name"], "embedding": entry["embedding"]})
        return result

    # -- geofence zones ----------------------------------------------------
    def _to_zone_record(self, z: Dict[str, Any]) -> ZoneRecord:
        return ZoneRecord(
            id=z["id"],
            name=z["name"],
            center_lat=z["center_lat"],
            center_lng=z["center_lng"],
            radius_meters=z["radius_meters"],
            is_active=z["is_active"],
            created_at=_parse_dt(z.get("created_at")),
        )

    def list_zones(self, active_only: bool = False) -> List[ZoneRecord]:
        data = self._load()
        zones = data["geofence_zones"]
        if active_only:
            zones = [z for z in zones if z["is_active"]]
        zones = sorted(zones, key=lambda z: z.get("created_at") or "", reverse=True)
        return [self._to_zone_record(z) for z in zones]

    def get_zone(self, zone_id: int) -> Optional[ZoneRecord]:
        data = self._load()
        for z in data["geofence_zones"]:
            if z["id"] == zone_id:
                return self._to_zone_record(z)
        return None

    def create_zone(self, name: str, center_lat: float, center_lng: float, radius_meters: float, is_active: bool, created_by: Optional[int]) -> ZoneRecord:
        data = self._load()
        zone = {
            "id": self._next_id(data, "geofence_zones"),
            "name": name,
            "center_lat": center_lat,
            "center_lng": center_lng,
            "radius_meters": radius_meters,
            "is_active": is_active,
            "created_by": created_by,
            "created_at": _now_iso(),
        }
        data["geofence_zones"].append(zone)
        self._save(data)
        return self._to_zone_record(zone)

    def update_zone(self, zone_id: int, updates: Dict[str, Any]) -> Optional[ZoneRecord]:
        data = self._load()
        for z in data["geofence_zones"]:
            if z["id"] == zone_id:
                z.update(updates)
                self._save(data)
                return self._to_zone_record(z)
        return None

    def delete_zone(self, zone_id: int) -> bool:
        data = self._load()
        before = len(data["geofence_zones"])
        data["geofence_zones"] = [z for z in data["geofence_zones"] if z["id"] != zone_id]
        if len(data["geofence_zones"]) == before:
            return False
        self._save(data)
        return True

    # -- attendance ----------------------------------------------------
    def _to_session(self, r: Dict[str, Any]) -> AttendanceSession:
        return AttendanceSession(
            id=r["id"],
            user_id=r["user_id"],
            check_in_at=_parse_dt(r["check_in_at"]),
            check_in_lat=r["check_in_lat"],
            check_in_lng=r["check_in_lng"],
            check_in_zone_id=r.get("check_in_zone_id"),
            check_in_similarity=r["check_in_similarity"],
            check_out_at=_parse_dt(r.get("check_out_at")),
            check_out_lat=r.get("check_out_lat"),
            check_out_lng=r.get("check_out_lng"),
            check_out_zone_id=r.get("check_out_zone_id"),
            check_out_similarity=r.get("check_out_similarity"),
        )

    def get_open_session(self, user_id: int) -> Optional[AttendanceSession]:
        data = self._load()
        open_sessions = [
            r for r in data["attendance_records"] if r["user_id"] == user_id and r.get("check_out_at") is None
        ]
        if not open_sessions:
            return None
        open_sessions.sort(key=lambda r: r["check_in_at"], reverse=True)
        return self._to_session(open_sessions[0])

    def create_attendance(self, user_id: int, check_in_at: datetime, lat: float, lng: float, zone_id: Optional[int], similarity: float) -> AttendanceSession:
        data = self._load()
        record = {
            "id": self._next_id(data, "attendance_records"),
            "user_id": user_id,
            "check_in_at": check_in_at.isoformat(),
            "check_in_lat": lat,
            "check_in_lng": lng,
            "check_in_zone_id": zone_id,
            "check_in_similarity": similarity,
            "check_out_at": None,
            "check_out_lat": None,
            "check_out_lng": None,
            "check_out_zone_id": None,
            "check_out_similarity": None,
        }
        data["attendance_records"].append(record)
        self._save(data)
        return self._to_session(record)

    def close_attendance(self, record_id: int, check_out_at: datetime, lat: float, lng: float, zone_id: Optional[int], similarity: float) -> AttendanceSession:
        data = self._load()
        for r in data["attendance_records"]:
            if r["id"] == record_id:
                r["check_out_at"] = check_out_at.isoformat()
                r["check_out_lat"] = lat
                r["check_out_lng"] = lng
                r["check_out_zone_id"] = zone_id
                r["check_out_similarity"] = similarity
                self._save(data)
                return self._to_session(r)
        raise ValueError(f"Attendance record {record_id} not found")

    def _to_attendance_view(self, r: Dict[str, Any], users_by_id: Dict[int, Any], zones_by_id: Dict[int, Any]) -> AttendanceRecordView:
        user = users_by_id.get(r["user_id"])
        check_in_zone = zones_by_id.get(r.get("check_in_zone_id"))
        check_out_zone = zones_by_id.get(r.get("check_out_zone_id"))
        return AttendanceRecordView(
            id=r["id"],
            user_id=r["user_id"],
            user_name=user["name"] if user else "?",
            check_in_at=_parse_dt(r["check_in_at"]),
            check_in_zone_name=check_in_zone["name"] if check_in_zone else None,
            check_out_at=_parse_dt(r.get("check_out_at")),
            check_out_zone_name=check_out_zone["name"] if check_out_zone else None,
        )

    def list_attendance(
        self,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AttendanceRecordView]:
        data = self._load()
        users_by_id = {u["id"]: u for u in data["users"]}
        zones_by_id = {z["id"]: z for z in data["geofence_zones"]}

        records = data["attendance_records"]
        if user_id is not None:
            records = [r for r in records if r["user_id"] == user_id]
        if date_from is not None:
            records = [r for r in records if _parse_dt(r["check_in_at"]) >= date_from]
        if date_to is not None:
            records = [r for r in records if _parse_dt(r["check_in_at"]) <= date_to]

        records = sorted(records, key=lambda r: r["check_in_at"], reverse=True)
        records = records[offset : offset + limit]
        return [self._to_attendance_view(r, users_by_id, zones_by_id) for r in records]

    def list_my_attendance(self, user_id: int) -> List[AttendanceRecordView]:
        return self.list_attendance(user_id=user_id, limit=1000)


json_store = JsonStore()
