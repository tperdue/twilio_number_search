"""SQLAlchemy async models for the application."""
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class CountryNumberTypes(Base):
    """Model for storing Twilio available phone number types by country."""
    
    __tablename__ = "country_number_types"
    
    country_code = Column(String(2), primary_key=True, index=True)
    country = Column(String(255), nullable=False)
    beta = Column(Boolean, default=False, nullable=False)
    local = Column(Boolean, default=False, nullable=False)
    toll_free = Column(Boolean, default=False, nullable=False)
    mobile = Column(Boolean, default=False, nullable=False)
    national = Column(Boolean, default=False, nullable=False)
    voip = Column(Boolean, default=False, nullable=False)
    shared_cost = Column(Boolean, default=False, nullable=False)
    machine_to_machine = Column(Boolean, default=False, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Regulation(Base):
    """Model for storing Twilio regulatory compliance regulations."""
    
    __tablename__ = "regulations"
    
    sid = Column(String(34), primary_key=True, index=True)
    friendly_name = Column(String(255), nullable=True)
    iso_country = Column(String(2), nullable=True, index=True)
    number_type = Column(String(50), nullable=True)
    end_user_type = Column(String(20), nullable=False, default="business")
    requirements = Column(JSON, nullable=True)
    url = Column(String(500), nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

