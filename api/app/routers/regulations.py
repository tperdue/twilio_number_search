"""Endpoints for querying regulatory compliance regulations."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional

from app.database import get_db_session
from app.models import Regulation, CountryNumberTypes
from app.schemas import RegulationResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/regulations", tags=["regulations"])


@router.get("/{country_code}", response_model=List[RegulationResponse])
async def get_regulations(
    country_code: str,
    number_type: Optional[str] = Query(None, description="Filter by number type (local, toll_free, mobile, etc.)"),
    only_available_types: bool = Query(False, description="Only show regulations for available phone types (default: False to show all regulations including private offerings)"),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get regulatory requirements for a specific country.
    Always returns regulations with end_user_type='business'.
    Queries database only - data must be synced first using POST /api/v1/sync/regulations.
    
    By default, returns all regulations regardless of number type availability, as some
    number types are available through private offerings and not exposed in the public API.
    
    Args:
        country_code: ISO country code (e.g., "US")
        number_type: Optional filter by number type
        only_available_types: Only show regulations for phone types available in the country (default: False)
        db: Database session
        
    Returns:
        List of regulations for the specified country
        
    Raises:
        404: If no regulations found for the country
    """
    country_code = country_code.upper()
    
    # Build query
    query = select(Regulation).where(
        and_(
            Regulation.iso_country == country_code,
            Regulation.end_user_type == "business"
        )
    )
    
    # Apply number type filter if provided
    if number_type:
        query = query.where(Regulation.number_type == number_type)
    
    # Filter by available types if enabled
    if only_available_types:
        # Query CountryNumberTypes to get available types for this country
        country_types_query = select(CountryNumberTypes).where(
            CountryNumberTypes.country_code == country_code
        )
        country_types_result = await db.execute(country_types_query)
        country_types = country_types_result.scalar_one_or_none()
        
        if country_types:
            # Build list of available number types
            available_types = []
            type_mapping = {
                "local": country_types.local,
                "toll_free": country_types.toll_free,
                "mobile": country_types.mobile,
                "national": country_types.national,
                "voip": country_types.voip,
                "shared_cost": country_types.shared_cost,
                "machine_to_machine": country_types.machine_to_machine,
            }
            
            for type_name, is_available in type_mapping.items():
                if is_available:
                    available_types.append(type_name)
            
            # Filter regulations: include those with number_type in available_types or number_type is None
            if available_types:
                query = query.where(
                    or_(
                        Regulation.number_type.in_(available_types),
                        Regulation.number_type.is_(None)
                    )
                )
            else:
                # No available types, only include general regulations (number_type is None)
                query = query.where(Regulation.number_type.is_(None))
        # If country_types is None, fallback to returning all regulations (country data not synced)
    
    # Query database
    result = await db.execute(query)
    regulations = result.scalars().all()
    
    # Return 404 if no regulations found
    if not regulations:
        raise HTTPException(
            status_code=404,
            detail=f"No regulations found for country {country_code}. Sync regulations first using POST /api/v1/sync/regulations"
        )
    
    return [RegulationResponse.model_validate(regulation) for regulation in regulations]

