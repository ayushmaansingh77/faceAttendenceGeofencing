from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

from config import FRONTEND_DIST_DIR

router = APIRouter(tags=["Frontend Views"])

SPA_INDEX = FRONTEND_DIST_DIR / "index.html"

NOT_BUILT_MESSAGE = """
<html><body style="font-family:sans-serif;padding:40px">
<h1>Frontend not built</h1>
<p>Run <code>npm install &amp;&amp; npm run build</code> in <code>frontend/</code>, then reload.</p>
</body></html>
"""


def _spa_index() -> Optional[Path]:
    if SPA_INDEX.exists():
        return SPA_INDEX
    return None


@router.get("/", response_class=HTMLResponse, summary="React SPA entry point")
def index():
    spa = _spa_index()
    if spa:
        return FileResponse(spa)
    return HTMLResponse(NOT_BUILT_MESSAGE, status_code=503)


@router.get("/{full_path:path}", response_class=HTMLResponse, summary="SPA client routes")
def spa_fallback(full_path: str):
    """
    Catch-all so React Router paths like /admin/employees work after refresh.
    API, docs, and OpenAPI stay on FastAPI routers registered first.
    """
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not found")

    static_file = FRONTEND_DIST_DIR / full_path
    if static_file.is_file():
        return FileResponse(static_file)

    spa = _spa_index()
    if spa:
        return FileResponse(spa)
    return HTMLResponse(NOT_BUILT_MESSAGE, status_code=503)
