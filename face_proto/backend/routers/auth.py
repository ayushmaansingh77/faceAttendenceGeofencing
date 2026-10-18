from fastapi import APIRouter, Depends, HTTPException, Request

from db import UserRecord, get_store
from rate_limit import limiter
from schemas import LoginRequest, LoginResponse, SignupRequest, UserSummary
from services import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _user_summary(user: UserRecord) -> UserSummary:
    return UserSummary(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        has_face_enrolled=user.has_face_enrolled,
    )


@router.post("/login", response_model=LoginResponse, summary="Log in with email and password")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest):
    user = get_store().get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.password_hash):
        return LoginResponse(ok=False, error="Invalid email or password.")
    if not user.is_active:
        return LoginResponse(ok=False, error="This account has been deactivated.")

    token = create_access_token(user)
    return LoginResponse(ok=True, token=token, user=_user_summary(user))


@router.post("/signup", response_model=LoginResponse, summary="Self-register a new employee account")
@limiter.limit("5/minute")
def signup(request: Request, req: SignupRequest):
    """
    Public self-registration always creates an "employee" account. Admin
    accounts cannot be self-registered — see FIRST_ADMIN_* bootstrap
    (db/seed_admin.py) or POST /api/admin/admins for how admins are created.
    """
    store = get_store()
    if store.get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    user = store.create_user(
        name=req.name.strip(),
        email=req.email.strip(),
        password_hash=hash_password(req.password),
        role="employee",
    )
    token = create_access_token(user)
    return LoginResponse(ok=True, token=token, user=_user_summary(user))


@router.get("/me", response_model=UserSummary, summary="Get the current logged-in user")
def me(current_user: UserRecord = Depends(get_current_user)):
    return _user_summary(current_user)
