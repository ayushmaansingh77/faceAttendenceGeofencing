"""
Shared slowapi Limiter instance, kept in its own module (not app.py) so
routers can import and apply it to individual endpoints without creating a
circular import with app.py (which registers the limiter on app.state and
wires up its exception handler).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
