from math import atan2, cos, radians, sin, sqrt
from typing import List, Optional, Tuple

from db.records import ZoneRecord

EARTH_RADIUS_METERS = 6371000.0


def haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two lat/lng points, in meters."""
    phi1, phi2 = radians(lat1), radians(lat2)
    d_phi = radians(lat2 - lat1)
    d_lambda = radians(lng2 - lng1)

    a = sin(d_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(d_lambda / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return EARTH_RADIUS_METERS * c


def find_matching_zone(
    lat: float,
    lng: float,
    zones: List[ZoneRecord],
) -> Tuple[Optional[ZoneRecord], Optional[float]]:
    """
    Return (matched_zone, distance_to_matched_zone) if the point falls inside
    any active zone's radius, else (None, distance_to_nearest_zone) so the
    caller can report how far away the nearest zone was.
    """
    if not zones:
        return None, None

    nearest_distance = None
    for zone in zones:
        distance = haversine_distance_m(lat, lng, zone.center_lat, zone.center_lng)
        if nearest_distance is None or distance < nearest_distance:
            nearest_distance = distance
        if distance <= zone.radius_meters:
            return zone, distance

    return None, nearest_distance
