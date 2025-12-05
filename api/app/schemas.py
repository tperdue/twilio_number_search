"""Pydantic schemas for request and response validation."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any, List, Dict
from enum import Enum


class CountryNumberTypesBase(BaseModel):
    """Base schema for country number types."""
    country_code: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    country: str = Field(..., description="Country name")
    beta: bool = Field(default=False, description="Whether country is in beta")
    local: bool = Field(default=False, description="Local numbers available")
    toll_free: bool = Field(default=False, description="Toll-free numbers available")
    mobile: bool = Field(default=False, description="Mobile numbers available")
    national: bool = Field(default=False, description="National numbers available")
    voip: bool = Field(default=False, description="VoIP numbers available")
    shared_cost: bool = Field(default=False, description="Shared cost numbers available")
    machine_to_machine: bool = Field(default=False, description="Machine-to-machine numbers available")


class CountryNumberTypesCreate(CountryNumberTypesBase):
    """Schema for creating/updating country number types."""
    pass


class CountryNumberTypesResponse(CountryNumberTypesBase):
    """Response schema for country number types."""
    last_updated: datetime
    
    class Config:
        from_attributes = True


class SyncRequest(BaseModel):
    """Request schema for triggering sync.
    
    Note: Twilio credentials are now loaded from environment variables.
    This request body can be empty or omitted.
    """
    pass


class SyncStatus(BaseModel):
    """Schema for sync job status."""
    job_id: str
    status: str = Field(..., description="Status: pending, in_progress, completed, failed")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    countries_processed: int = 0
    countries_total: Optional[int] = None
    error: Optional[str] = None


class RegulationBase(BaseModel):
    """Base schema for regulatory compliance regulations."""
    sid: str = Field(..., min_length=34, max_length=34, description="Unique regulation identifier")
    friendly_name: Optional[str] = Field(None, description="Human-readable description of the regulation")
    iso_country: Optional[str] = Field(None, min_length=2, max_length=2, description="ISO country code")
    number_type: Optional[str] = Field(None, description="Type of phone number restricted by the regulation")
    end_user_type: str = Field(default="business", description="Type of end user (always 'business')")
    requirements: Optional[Dict[str, Any]] = Field(None, description="Regulatory requirements including end_user and supporting_document information")
    url: Optional[str] = Field(None, description="Absolute URL of the Regulation resource")


class RegulationResponse(RegulationBase):
    """Response schema for regulatory compliance regulations."""
    last_updated: datetime = Field(default_factory=lambda: datetime.utcnow())
    
    class Config:
        from_attributes = True


class NumberType(str, Enum):
    """Enum for number types."""
    mobile = "mobile"
    local = "local"
    toll_free = "toll-free"


class NumberSearchRequest(BaseModel):
    """Request schema for searching available phone numbers.
    
    Note: Twilio credentials are now loaded from environment variables.
    """
    country_code: str = Field(..., min_length=2, max_length=2, description="ISO country code (e.g., 'US')")
    number_type: NumberType = Field(..., description="Number type: mobile, local, or toll-free")
    sms_enabled: Optional[bool] = Field(None, description="Filter by SMS capability (True/False)")
    voice_enabled: Optional[bool] = Field(None, description="Filter by Voice capability (True/False)")


class PhoneNumberCapabilities(BaseModel):
    """Schema for phone number capabilities."""
    mms: Optional[bool] = None
    sms: Optional[bool] = None
    voice: Optional[bool] = None
    fax: Optional[bool] = None


class AvailableNumberResponse(BaseModel):
    """Response schema for available phone numbers."""
    phone_number: Optional[str] = Field(None, description="Phone number in E.164 format")
    friendly_name: Optional[str] = Field(None, description="Formatted version of the phone number")
    capabilities: Optional[PhoneNumberCapabilities] = Field(None, description="Phone number capabilities")
    iso_country: Optional[str] = Field(None, description="ISO country code")
    address_requirements: Optional[str] = Field(None, description="Address requirement type: none, any, local, or foreign")
    beta: Optional[bool] = Field(None, description="Whether the phone number is new to Twilio platform")
    lata: Optional[str] = Field(None, description="LATA (Local Access and Transport Area) - US/Canada only")
    locality: Optional[str] = Field(None, description="Locality or city of the phone number's location")
    rate_center: Optional[str] = Field(None, description="Rate center - US/Canada only")
    latitude: Optional[float] = Field(None, description="Latitude of phone number's location - US/Canada only")
    longitude: Optional[float] = Field(None, description="Longitude of phone number's location - US/Canada only")
    region: Optional[str] = Field(None, description="State or province abbreviation - US/Canada only")
    postal_code: Optional[str] = Field(None, description="Postal or ZIP code - US/Canada only")

