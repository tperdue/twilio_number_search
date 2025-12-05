"""Endpoints for querying regulatory compliance regulations."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db_session
from app.models import Regulation, CountryNumberTypes
from app.schemas import RegulationResponse
from app.services.excel_export import generate_regulation_excel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/regulations", tags=["regulations"])


class ExportRegulationsRequest(BaseModel):
    """Request schema for exporting multiple regulations."""
    regulation_sids: List[str] = []


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


@router.get("/{regulation_sid}/export")
async def export_regulation(
    regulation_sid: str,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Export a single regulation as an Excel template/checklist.
    
    Args:
        regulation_sid: The SID of the regulation to export
        db: Database session
        
    Returns:
        Excel file download
    """
    # Query the regulation
    query = select(Regulation).where(Regulation.sid == regulation_sid)
    result = await db.execute(query)
    regulation = result.scalar_one_or_none()
    
    if not regulation:
        raise HTTPException(
            status_code=404,
            detail=f"Regulation {regulation_sid} not found"
        )
    
    # Convert to dict for Excel export
    regulation_dict = {
        'sid': regulation.sid,
        'friendly_name': regulation.friendly_name,
        'iso_country': regulation.iso_country,
        'number_type': regulation.number_type,
        'end_user_type': regulation.end_user_type,
        'requirements': regulation.requirements,
        'last_updated': regulation.last_updated,
    }
    
    # Generate Excel file
    excel_file = generate_regulation_excel([regulation_dict])
    
    # Generate filename
    filename = f"regulation_{regulation_sid[:8]}.xlsx"
    if regulation.friendly_name:
        # Sanitize filename
        safe_name = "".join(c for c in regulation.friendly_name[:30] if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_name}_{regulation_sid[:8]}.xlsx"
    
    # Return file as response
    return Response(
        content=excel_file.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post("/export")
async def export_regulations(
    request: ExportRegulationsRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Export multiple regulations as a multi-tab Excel file.
    
    Args:
        request: Request body containing list of regulation SIDs
        db: Database session
        
    Returns:
        Excel file download with one tab per regulation
    """
    if not request.regulation_sids:
        raise HTTPException(
            status_code=400,
            detail="At least one regulation SID is required"
        )
    
    # Query all regulations
    query = select(Regulation).where(Regulation.sid.in_(request.regulation_sids))
    result = await db.execute(query)
    regulations = result.scalars().all()
    
    if not regulations:
        raise HTTPException(
            status_code=404,
            detail="No regulations found for the provided SIDs"
        )
    
    # Check if all requested regulations were found
    found_sids = {reg.sid for reg in regulations}
    missing_sids = set(request.regulation_sids) - found_sids
    if missing_sids:
        logger.warning(f"Some regulation SIDs not found: {missing_sids}")
    
    # Convert to dicts for Excel export
    regulation_dicts = []
    for regulation in regulations:
        regulation_dicts.append({
            'sid': regulation.sid,
            'friendly_name': regulation.friendly_name,
            'iso_country': regulation.iso_country,
            'number_type': regulation.number_type,
            'end_user_type': regulation.end_user_type,
            'requirements': regulation.requirements,
            'last_updated': regulation.last_updated,
        })
    
    # Generate Excel file
    excel_file = generate_regulation_excel(regulation_dicts)
    
    # Generate filename
    filename = f"regulations_export_{len(regulation_dicts)}_regulations.xlsx"
    
    # Return file as response
    return Response(
        content=excel_file.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

