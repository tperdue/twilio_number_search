"""Endpoints for querying country number types."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from app.database import get_db_session
from app.models import CountryNumberTypes
from app.schemas import CountryNumberTypesResponse

router = APIRouter(prefix="/countries", tags=["countries"])


@router.get("", response_model=List[CountryNumberTypesResponse])
async def list_countries(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    number_type: Optional[str] = Query(None, description="Filter by number type (local, toll_free, mobile, etc.)"),
    db: AsyncSession = Depends(get_db_session)
):
    """
    List all countries with available number types.
    
    Args:
        skip: Pagination offset
        limit: Maximum number of results
        number_type: Optional filter by number type availability
        db: Database session
        
    Returns:
        List of country number types
    """
    query = select(CountryNumberTypes)
    
    # Apply number type filter if provided
    if number_type:
        # Map number type to column
        type_mapping = {
            "local": CountryNumberTypes.local,
            "toll_free": CountryNumberTypes.toll_free,
            "mobile": CountryNumberTypes.mobile,
            "national": CountryNumberTypes.national,
            "voip": CountryNumberTypes.voip,
            "shared_cost": CountryNumberTypes.shared_cost,
            "machine_to_machine": CountryNumberTypes.machine_to_machine,
        }
        
        if number_type in type_mapping:
            query = query.where(type_mapping[number_type] == True)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid number type. Must be one of: {', '.join(type_mapping.keys())}"
            )
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    countries = result.scalars().all()
    
    return [CountryNumberTypesResponse.model_validate(country) for country in countries]


@router.get("/{country_code}", response_model=CountryNumberTypesResponse)
async def get_country(
    country_code: str,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get number types for a specific country.
    
    Args:
        country_code: ISO country code (e.g., "US")
        db: Database session
        
    Returns:
        Country number types
    """
    query = select(CountryNumberTypes).where(CountryNumberTypes.country_code == country_code.upper())
    
    result = await db.execute(query)
    country = result.scalar_one_or_none()
    
    if not country:
        raise HTTPException(status_code=404, detail=f"Country {country_code} not found")
    
    return CountryNumberTypesResponse.model_validate(country)

