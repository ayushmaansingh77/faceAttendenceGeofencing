from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from config import MATCH_THRESHOLD
from db import UserRecord, get_store
from rate_limit import limiter
from schemas import AttendanceCheckResponse, AttendanceListResponse, AttendanceRecordOut, CheckRequest
from services import face_service, find_matching_zone, get_current_user

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _verify_face(req: CheckRequest, current_user: UserRecord):
    """
    Decode + embed the submitted image and compare it ONLY against the
    logged-in user's own enrolled embedding (never searched against other
    users) — this is what prevents checking in "as" someone else.

    Returns (similarity, error_response). error_response is an
    AttendanceCheckResponse to return immediately, or None on success.
    """
    stored_embedding = get_store().get_embedding(current_user.id)
    if stored_embedding is None:
        return None, AttendanceCheckResponse(ok=False, error="Enroll your face before checking in/out.")

    try:
        img = face_service.decode_image(req.image)
    except Exception as e:
        return None, AttendanceCheckResponse(ok=False, error=f"Invalid image format: {str(e)}")

    embedding, error = face_service.get_embedding(img)
    if error:
        return None, AttendanceCheckResponse(ok=False, error=error)

    if len(stored_embedding) != len(embedding):
        # The recognition model was changed after this user enrolled (e.g.
        # the ArcFace -> SFace swap: 512-D vs 128-D vectors). Their stored
        # embedding is meaningless against the current model — surface a
        # clear, specific message instead of letting cosine_similarity fail
        # on a shape mismatch or silently compare incompatible vectors.
        return None, AttendanceCheckResponse(
            ok=False,
            error="Your face enrollment is out of date (recognition model changed). Please re-enroll your face.",
        )

    similarity = face_service.cosine_similarity(embedding, stored_embedding)
    if similarity < MATCH_THRESHOLD:
        return None, AttendanceCheckResponse(
            ok=False,
            error="Face does not match your enrolled identity.",
            similarity=round(similarity, 4),
        )

    return similarity, None


def _check_zone(req: CheckRequest):
    """Returns (zone, distance, error_response)."""
    active_zones = get_store().list_zones(active_only=True)
    zone, distance = find_matching_zone(req.lat, req.lng, active_zones)
    if zone is None:
        if distance is None:
            message = "No geofence zones are configured yet."
        else:
            message = f"You are {round(distance)}m from the nearest zone. Move inside a zone to check in/out."
        return None, distance, AttendanceCheckResponse(ok=False, error=message, distance_meters=distance)
    return zone, distance, None


@router.post("/check-in", response_model=AttendanceCheckResponse, summary="Check in (face + geofence verified)")
@limiter.limit("15/minute")
def check_in(request: Request, req: CheckRequest, current_user: UserRecord = Depends(get_current_user)):
    similarity, err = _verify_face(req, current_user)
    if err:
        return err

    zone, distance, err = _check_zone(req)
    if err:
        return err

    store = get_store()
    if store.get_open_session(current_user.id):
        return AttendanceCheckResponse(ok=False, error="You already have an open check-in. Check out first.")

    record = store.create_attendance(
        user_id=current_user.id,
        check_in_at=datetime.now(timezone.utc),
        lat=req.lat,
        lng=req.lng,
        zone_id=zone.id,
        similarity=similarity,
    )

    return AttendanceCheckResponse(
        ok=True,
        message=f"Checked in at {zone.name}.",
        record_id=record.id,
        checked_at=record.check_in_at.isoformat(),
        zone_name=zone.name,
        distance_meters=round(distance, 1) if distance is not None else None,
        similarity=round(similarity, 4),
    )


@router.post("/check-out", response_model=AttendanceCheckResponse, summary="Check out (face + geofence verified)")
@limiter.limit("15/minute")
def check_out(request: Request, req: CheckRequest, current_user: UserRecord = Depends(get_current_user)):
    similarity, err = _verify_face(req, current_user)
    if err:
        return err

    zone, distance, err = _check_zone(req)
    if err:
        return err

    store = get_store()
    open_session = store.get_open_session(current_user.id)
    if not open_session:
        return AttendanceCheckResponse(ok=False, error="No active check-in found.")

    record = store.close_attendance(
        record_id=open_session.id,
        check_out_at=datetime.now(timezone.utc),
        lat=req.lat,
        lng=req.lng,
        zone_id=zone.id,
        similarity=similarity,
    )

    return AttendanceCheckResponse(
        ok=True,
        message=f"Checked out at {zone.name}.",
        record_id=record.id,
        checked_at=record.check_out_at.isoformat(),
        zone_name=zone.name,
        distance_meters=round(distance, 1) if distance is not None else None,
        similarity=round(similarity, 4),
    )


@router.get("/me", response_model=AttendanceListResponse, summary="Current user's own attendance history")
def my_attendance(current_user: UserRecord = Depends(get_current_user)):
    records = get_store().list_my_attendance(current_user.id)
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
