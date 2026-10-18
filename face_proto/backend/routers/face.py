from fastapi import APIRouter, Depends, Request

from config import MATCH_THRESHOLD
from db import UserRecord, get_store
from rate_limit import limiter
from schemas import (
    EnrollFaceRequest,
    EnrollFaceResponse,
    RecognizeRequest,
    RecognizeResponse,
)
from services import face_service, get_current_user, require_admin

router = APIRouter(prefix="/api/face", tags=["Face Recognition"])


@router.post("/enroll", response_model=EnrollFaceResponse, summary="Enroll (or re-enroll) the current user's face")
def enroll(req: EnrollFaceRequest, current_user: UserRecord = Depends(get_current_user)):
    try:
        img = face_service.decode_image(req.image)
    except Exception as e:
        return EnrollFaceResponse(ok=False, error=f"Invalid image format: {str(e)}")

    embedding, error = face_service.get_embedding(img)
    if error:
        return EnrollFaceResponse(ok=False, error=error)

    enrolled_at = get_store().upsert_embedding(current_user.id, embedding.tolist())

    return EnrollFaceResponse(ok=True, message="Face enrolled successfully.", enrolled_at=enrolled_at)


@router.post(
    "/recognize",
    response_model=RecognizeResponse,
    summary="Admin-only: recognize a face against all enrolled users",
)
@limiter.limit("20/minute")
def recognize(request: Request, req: RecognizeRequest, current_user: UserRecord = Depends(require_admin)):
    try:
        img = face_service.decode_image(req.image)
    except Exception as e:
        return RecognizeResponse(ok=False, error=f"Invalid image format: {str(e)}")

    embedding, error = face_service.get_embedding(img)
    if error:
        return RecognizeResponse(ok=False, error=error)

    enrolled = get_store().list_all_embeddings()
    if not enrolled:
        return RecognizeResponse(ok=True, match=False, message="No one has enrolled a face yet.")

    match_result = face_service.find_best_match(
        target_embedding=embedding,
        candidates=enrolled,
        threshold=MATCH_THRESHOLD,
    )

    if match_result["match"]:
        matched = match_result["person"]
        return RecognizeResponse(
            ok=True,
            match=True,
            name=matched["name"],
            user_id=matched["user_id"],
            similarity=match_result["similarity"],
            threshold=match_result["threshold"],
        )

    return RecognizeResponse(
        ok=True,
        match=False,
        message="Unknown face - no match above threshold.",
        best_similarity=match_result["similarity"],
        threshold=match_result["threshold"],
    )
