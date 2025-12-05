"""Endpoints for searching available Twilio phone numbers."""
from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.config import settings
from app.schemas import NumberSearchRequest, AvailableNumberResponse
from app.services.twilio_client import TwilioClient, TwilioAPIError, TwilioRateLimitError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/numbers", tags=["numbers"])


def _validate_twilio_credentials():
    """Validate that Twilio credentials are configured."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(
            status_code=500,
            detail="Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
        )


@router.post("/search", response_model=List[AvailableNumberResponse])
async def search_numbers(request: NumberSearchRequest):
    """
    Search for available phone numbers by country and number type.
    
    Note: When both sms_enabled and voice_enabled are specified, filters are applied with AND logic
    (numbers must match both criteria). If no results are returned, try searching with only one filter
    or without filters to see available numbers.
    
    Note: Twilio credentials are loaded from environment variables.
    
    Args:
        request: Search request containing country_code, number_type, and optional filters
        
    Returns:
        List of available phone numbers matching the criteria
        
    Raises:
        400: If invalid number type or request parameters
        500: If Twilio API error occurs or credentials are not configured
    """
    # Validate credentials are configured
    _validate_twilio_credentials()
    
    client = None
    try:
        # Create Twilio client with credentials from settings
        client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
        
        logger.info(f"Searching for {request.number_type.value} numbers in {request.country_code} with sms_enabled={request.sms_enabled}, voice_enabled={request.voice_enabled}")
        
        # Search for available numbers
        numbers = await client.search_available_numbers(
            country_code=request.country_code.upper(),
            number_type=request.number_type.value,
            sms_enabled=request.sms_enabled,
            voice_enabled=request.voice_enabled
        )
        
        logger.info(f"Twilio API returned {len(numbers)} numbers")
        
        # Convert to response models
        result = []
        for number in numbers:
            # Handle capabilities if present
            # Twilio returns capabilities with mixed casing: 'MMS', 'SMS' (uppercase), 'voice' (lowercase)
            # We need to normalize to lowercase to match our schema
            capabilities = None
            if "capabilities" in number and number["capabilities"]:
                from app.schemas import PhoneNumberCapabilities
                # Normalize capabilities keys to lowercase
                caps = number["capabilities"]
                normalized_caps = {
                    "mms": caps.get("MMS") if "MMS" in caps else caps.get("mms"),
                    "sms": caps.get("SMS") if "SMS" in caps else caps.get("sms"),
                    "voice": caps.get("voice") if "voice" in caps else caps.get("Voice"),
                    "fax": caps.get("fax") if "fax" in caps else caps.get("Fax"),
                }
                capabilities = PhoneNumberCapabilities(**normalized_caps)
            
            result.append(AvailableNumberResponse(
                phone_number=number.get("phone_number"),
                friendly_name=number.get("friendly_name"),
                capabilities=capabilities,
                iso_country=number.get("iso_country"),
                address_requirements=number.get("address_requirements"),
                beta=number.get("beta"),
                lata=number.get("lata"),
                locality=number.get("locality"),
                rate_center=number.get("rate_center"),
                latitude=number.get("latitude"),
                longitude=number.get("longitude"),
                region=number.get("region"),
                postal_code=number.get("postal_code")
            ))
        
        logger.info(f"Found {len(result)} available {request.number_type.value} numbers for {request.country_code}")
        return result
        
    except TwilioAPIError as e:
        logger.error(f"Twilio API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except TwilioRateLimitError as e:
        logger.error(f"Twilio rate limit error: {e}")
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error searching numbers: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        if client:
            await client.close()

