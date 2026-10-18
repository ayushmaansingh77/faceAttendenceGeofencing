"""
Bootstraps the first admin account.

Employee accounts can only be created by an existing admin, and admins can
only be created by an existing admin (or here) — so without this, there
would be no way to create the very first admin account. On startup (and
when run standalone via `python -m db.seed_admin`), if FIRST_ADMIN_EMAIL /
FIRST_ADMIN_PASSWORD are set and no admin exists yet, one is created.
Works against whichever storage backend is active (config.STORAGE_BACKEND).
"""

from config import FIRST_ADMIN_EMAIL, FIRST_ADMIN_NAME, FIRST_ADMIN_PASSWORD
from services.auth_service import hash_password

from .store import get_store


def ensure_first_admin() -> None:
    if not FIRST_ADMIN_EMAIL or not FIRST_ADMIN_PASSWORD:
        print("FIRST_ADMIN_EMAIL/FIRST_ADMIN_PASSWORD not set — skipping admin bootstrap.")
        return

    store = get_store()

    if store.count_admins() > 0:
        print("An admin already exists — skipping bootstrap.")
        return

    if store.get_user_by_email(FIRST_ADMIN_EMAIL):
        print(f"User with email {FIRST_ADMIN_EMAIL} already exists but is not an admin — skipping bootstrap.")
        return

    store.create_user(
        name=FIRST_ADMIN_NAME,
        email=FIRST_ADMIN_EMAIL,
        password_hash=hash_password(FIRST_ADMIN_PASSWORD),
        role="admin",
    )
    print(f"First admin created: {FIRST_ADMIN_EMAIL}")


if __name__ == "__main__":
    from .store import init_storage

    init_storage()
    ensure_first_admin()
