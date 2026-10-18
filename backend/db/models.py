from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # "admin" | "employee"
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    face_embedding = relationship(
        "FaceEmbedding", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    attendance_records = relationship(
        "AttendanceRecord", back_populates="user", cascade="all, delete-orphan"
    )


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    embedding = Column(ARRAY(Float), nullable=False)  # 512-D L2-normalized vector
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="face_embedding")


class GeofenceZone(Base):
    __tablename__ = "geofence_zones"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    radius_meters = Column(Float, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AttendanceRecord(Base):
    """
    One row per check-in/check-out pair (open/close model). A row with
    check_out_at IS NULL is that user's currently "open" session.
    """

    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("user_id", "check_in_at", name="uq_attendance_user_checkin"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    check_in_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    check_in_lat = Column(Float, nullable=False)
    check_in_lng = Column(Float, nullable=False)
    check_in_zone_id = Column(Integer, ForeignKey("geofence_zones.id"), nullable=True)
    check_in_similarity = Column(Float, nullable=False)

    check_out_at = Column(DateTime(timezone=True), nullable=True)
    check_out_lat = Column(Float, nullable=True)
    check_out_lng = Column(Float, nullable=True)
    check_out_zone_id = Column(Integer, ForeignKey("geofence_zones.id"), nullable=True)
    check_out_similarity = Column(Float, nullable=True)

    user = relationship("User", back_populates="attendance_records")
    check_in_zone = relationship("GeofenceZone", foreign_keys=[check_in_zone_id])
    check_out_zone = relationship("GeofenceZone", foreign_keys=[check_out_zone_id])
