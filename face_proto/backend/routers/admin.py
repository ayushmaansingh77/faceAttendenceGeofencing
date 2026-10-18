from datetime import date, datetime, time, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from db import UserRecord, ZoneRecord, get_store
from schemas import (
    AttendanceListResponse,
    AttendanceRecordOut,
    CreateAdminRequest,
    CreateEmployeeRequest,
    CreateEmployeeResponse,
    EmployeeListResponse,
    GeofenceZoneCreate,
    GeofenceZoneListResponse,
    GeofenceZoneOut,
    GeofenceZoneResponse,
    GeofenceZoneUpdate,
    SetActiveRequest,
    UserSummary,
)
from services import hash_password, require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


def _user_summary(user: UserRecord) -> UserSummary:
    return UserSummary(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        has_face_enrolled=user.has_face_enrolled,
    )


def _zone_out(zone: ZoneRecord) -> GeofenceZoneOut:
    return GeofenceZoneOut(
        id=zone.id,
        name=zone.name,
        center_lat=zone.center_lat,
        center_lng=zone.center_lng,
        radius_meters=zone.radius_meters,
        is_active=zone.is_active,
        created_at=zone.created_at,
    )


# ---------------------------------------------------------------------------
# Employee management
# ---------------------------------------------------------------------------
@router.post("/employees", response_model=CreateEmployeeResponse, summary="Create an employee account")
def create_employee(req: CreateEmployeeRequest):
    store = get_store()
    if store.get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    employee = store.create_user(
        name=req.name.strip(),
        email=req.email.strip(),
        password_hash=hash_password(req.password),
        role="employee",
    )
    return CreateEmployeeResponse(ok=True, user=_user_summary(employee))


@router.get("/employees", response_model=EmployeeListResponse, summary="List all employees")
def list_employees():
    employees = get_store().list_employees()
    return EmployeeListResponse(ok=True, employees=[_user_summary(e) for e in employees])


@router.post(
    "/admins",
    response_model=CreateEmployeeResponse,
    summary="Create another admin account (existing-admin-only; no public admin signup exists)",
)
def create_admin(req: CreateAdminRequest):
    store = get_store()
    if store.get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    admin = store.create_user(
        name=req.name.strip(),
        email=req.email.strip(),
        password_hash=hash_password(req.password),
        role="admin",
    )
    return CreateEmployeeResponse(ok=True, user=_user_summary(admin))


@router.patch("/employees/{employee_id}", response_model=CreateEmployeeResponse, summary="Activate/deactivate an employee")
def set_employee_active(employee_id: int, req: SetActiveRequest):
    employee = get_store().set_user_active(employee_id, req.is_active)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return CreateEmployeeResponse(ok=True, user=_user_summary(employee))


@router.delete("/employees/{employee_id}", summary="Permanently delete an employee")
def delete_employee(employee_id: int):
    if not get_store().delete_user(employee_id):
        raise HTTPException(status_code=404, detail="Employee not found.")
    return {"ok": True, "message": "Employee deleted. Their face enrollment and attendance history were removed too."}


# ---------------------------------------------------------------------------
# Geofence zones
# ---------------------------------------------------------------------------
@router.post("/geofence-zones", response_model=GeofenceZoneResponse, summary="Create a geofence zone")
def create_zone(req: GeofenceZoneCreate, current_user: UserRecord = Depends(require_admin)):
    zone = get_store().create_zone(
        name=req.name.strip(),
        center_lat=req.center_lat,
        center_lng=req.center_lng,
        radius_meters=req.radius_meters,
        is_active=req.is_active,
        created_by=current_user.id,
    )
    return GeofenceZoneResponse(ok=True, zone=_zone_out(zone))


@router.get("/geofence-zones", response_model=GeofenceZoneListResponse, summary="List all geofence zones")
def list_zones():
    zones = get_store().list_zones()
    return GeofenceZoneListResponse(ok=True, zones=[_zone_out(z) for z in zones])


@router.put("/geofence-zones/{zone_id}", response_model=GeofenceZoneResponse, summary="Update a geofence zone")
def update_zone(zone_id: int, req: GeofenceZoneUpdate):
    updates = req.model_dump(exclude_unset=True)
    zone = get_store().update_zone(zone_id, updates)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found.")
    return GeofenceZoneResponse(ok=True, zone=_zone_out(zone))


@router.delete("/geofence-zones/{zone_id}", summary="Delete a geofence zone")
def delete_zone(zone_id: int):
    if not get_store().delete_zone(zone_id):
        raise HTTPException(status_code=404, detail="Zone not found.")
    return {"ok": True, "message": "Zone deleted."}


# ---------------------------------------------------------------------------
# Attendance overview
# ---------------------------------------------------------------------------
@router.get("/attendance", response_model=AttendanceListResponse, summary="List attendance records (filterable)")
def list_attendance(
    employee_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    records = get_store().list_attendance(
        user_id=employee_id,
        date_from=datetime.combine(date_from, time.min, tzinfo=timezone.utc) if date_from else None,
        date_to=datetime.combine(date_to, time.max, tzinfo=timezone.utc) if date_to else None,
        limit=limit,
        offset=offset,
    )
    return AttendanceListResponse(
        ok=True,
        records=[
            AttendanceRecordOut(
                id=r.id,
                user_id=r.user_id,
                user_name=r.user_name,
                check_in_at=r.check_in_at,
                check_in_zone_name=r.check_in_zone_name,
                check_out_at=r.check_out_at,
                check_out_zone_name=r.check_out_zone_name,
            )
            for r in records
        ],
    )
