"""Background task for syncing Twilio number types and regulations."""
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert

from app.services.twilio_client import TwilioClient
from app.models import CountryNumberTypes, Regulation
from app.schemas import CountryNumberTypesCreate
import logging

logger = logging.getLogger(__name__)

# In-memory storage for sync job status (in production, use Redis or database)
sync_jobs: Dict[str, Dict] = {}


async def sync_twilio_number_types(
    account_sid: str,
    auth_token: str,
    job_id: Optional[str] = None
) -> list[Dict]:
    """
    Background task to sync Twilio number types to database.
    
    Args:
        account_sid: Twilio Account SID
        auth_token: Twilio Auth Token
        job_id: Optional job ID for tracking
        
    Returns:
        List of country data dictionaries ready for database upsert
    """
    if job_id is None:
        job_id = str(uuid.uuid4())
    
    # Initialize job status
    sync_jobs[job_id] = {
        "status": "in_progress",
        "started_at": datetime.utcnow(),
        "countries_processed": 0,
        "countries_total": None,
        "error": None,
    }
    
    try:
        # Create Twilio client
        client = TwilioClient(account_sid, auth_token)
        
        try:
            # Fetch all countries
            logger.info(f"Job {job_id}: Fetching countries from Twilio API")
            countries = await client.list_countries()
            sync_jobs[job_id]["countries_total"] = len(countries)
            
            # Process countries with concurrency limit
            semaphore = asyncio.Semaphore(10)  # Limit to 10 concurrent requests
            
            async def process_country(country: Dict) -> None:
                """Process a single country."""
                async with semaphore:
                    country_code = country.get("country_code")
                    if not country_code:
                        return
                    
                    try:
                        # Fetch country details
                        country_details = await client.get_country_details(country_code)
                        
                        # Extract number types
                        number_types = client.extract_number_types(country_details)
                        
                        # Prepare data for upsert
                        country_data = {
                            "country_code": country_code,
                            "country": country_details.get("country", ""),
                            "beta": country_details.get("beta", False),
                            **number_types,
                        }
                        
                        # Upsert to database (will be done in batch)
                        return country_data
                    except Exception as e:
                        logger.error(f"Error processing country {country_code}: {e}")
                        return None
            
            # Process all countries concurrently
            tasks = [process_country(country) for country in countries]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out None and exceptions
            valid_results = [
                r for r in results
                if r is not None and not isinstance(r, Exception)
            ]
            
            # Batch upsert to database
            # Note: This requires a database session, which should be passed or created here
            # For now, we'll return the data and handle upsert in the router
            
            sync_jobs[job_id]["countries_processed"] = len(valid_results)
            sync_jobs[job_id]["status"] = "completed"
            sync_jobs[job_id]["completed_at"] = datetime.utcnow()
            
            logger.info(f"Job {job_id}: Completed. Processed {len(valid_results)} countries")
            
            return valid_results
            
        finally:
            await client.close()
            
    except Exception as e:
        logger.error(f"Job {job_id}: Error during sync: {e}")
        sync_jobs[job_id]["status"] = "failed"
        sync_jobs[job_id]["error"] = str(e)
        sync_jobs[job_id]["completed_at"] = datetime.utcnow()
        raise


async def upsert_countries_to_db(
    db: AsyncSession,
    countries_data: list[Dict]
) -> None:
    """
    Upsert countries data to database.
    
    Args:
        db: Database session
        countries_data: List of country data dictionaries
    """
    if not countries_data:
        return
    
    # Prepare data for bulk upsert
    values = []
    for country in countries_data:
        values.append({
            "country_code": country["country_code"],
            "country": country["country"],
            "beta": country["beta"],
            "local": country["local"],
            "toll_free": country["toll_free"],
            "mobile": country["mobile"],
            "national": country["national"],
            "voip": country["voip"],
            "shared_cost": country["shared_cost"],
            "machine_to_machine": country["machine_to_machine"],
        })
    
    # Use PostgreSQL INSERT ... ON CONFLICT for upsert
    stmt = insert(CountryNumberTypes).values(values)
    stmt = stmt.on_conflict_do_update(
        index_elements=["country_code"],
        set_=dict(
            country=stmt.excluded.country,
            beta=stmt.excluded.beta,
            local=stmt.excluded.local,
            toll_free=stmt.excluded.toll_free,
            mobile=stmt.excluded.mobile,
            national=stmt.excluded.national,
            voip=stmt.excluded.voip,
            shared_cost=stmt.excluded.shared_cost,
            machine_to_machine=stmt.excluded.machine_to_machine,
            last_updated=func.now(),
        )
    )
    
    await db.execute(stmt)
    await db.commit()
    
    logger.info(f"Upserted {len(values)} countries to database")


def get_sync_job_status(job_id: str) -> Optional[Dict]:
    """Get status of a sync job."""
    return sync_jobs.get(job_id)


async def sync_twilio_regulations(
    account_sid: str,
    auth_token: str,
    job_id: Optional[str] = None
) -> list[Dict]:
    """
    Background task to sync Twilio regulatory compliance regulations to database.
    
    Args:
        account_sid: Twilio Account SID
        auth_token: Twilio Auth Token
        job_id: Optional job ID for tracking
        
    Returns:
        List of regulation data dictionaries ready for database upsert
    """
    if job_id is None:
        job_id = str(uuid.uuid4())
    
    # Initialize job status
    sync_jobs[job_id] = {
        "status": "in_progress",
        "started_at": datetime.utcnow(),
        "countries_processed": 0,
        "countries_total": None,
        "error": None,
    }
    
    try:
        # Create Twilio client
        client = TwilioClient(account_sid, auth_token)
        
        try:
            # First, get list of all countries
            logger.info(f"Job {job_id}: Fetching countries from Twilio API")
            countries = await client.list_countries()
            sync_jobs[job_id]["countries_total"] = len(countries)
            
            # Process countries with concurrency limit
            semaphore = asyncio.Semaphore(10)  # Limit to 10 concurrent requests
            
            async def process_country_regulations(country: Dict) -> List[Dict]:
                """Process regulations for a single country."""
                async with semaphore:
                    country_code = country.get("country_code")
                    if not country_code:
                        return []
                    
                    try:
                        # Fetch regulations for this country (always business end user type)
                        regulations = await client.list_regulations(
                            country_code=country_code,
                            include_constraints=True
                        )
                        
                        # Prepare data for upsert
                        regulations_data = []
                        for reg in regulations:
                            regulations_data.append({
                                "sid": reg.get("sid"),
                                "friendly_name": reg.get("friendly_name"),
                                "iso_country": reg.get("iso_country"),
                                "number_type": reg.get("number_type"),
                                "end_user_type": "business",  # Always business
                                "requirements": reg.get("requirements"),
                                "url": reg.get("url"),
                            })
                        
                        return regulations_data
                    except Exception as e:
                        logger.error(f"Error processing regulations for country {country_code}: {e}")
                        return []
            
            # Process all countries concurrently
            tasks = [process_country_regulations(country) for country in countries]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Flatten results and filter out exceptions
            all_regulations = []
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Exception in regulation sync: {result}")
                elif isinstance(result, list):
                    all_regulations.extend(result)
            
            sync_jobs[job_id]["countries_processed"] = len(countries)
            sync_jobs[job_id]["status"] = "completed"
            sync_jobs[job_id]["completed_at"] = datetime.utcnow()
            
            logger.info(f"Job {job_id}: Completed. Processed {len(all_regulations)} regulations from {len(countries)} countries")
            
            return all_regulations
            
        finally:
            await client.close()
            
    except Exception as e:
        logger.error(f"Job {job_id}: Error during regulation sync: {e}")
        sync_jobs[job_id]["status"] = "failed"
        sync_jobs[job_id]["error"] = str(e)
        sync_jobs[job_id]["completed_at"] = datetime.utcnow()
        raise


async def upsert_regulations_to_db(
    db: AsyncSession,
    regulations_data: list[Dict]
) -> None:
    """
    Upsert regulations data to database.
    
    Args:
        db: Database session
        regulations_data: List of regulation data dictionaries
    """
    if not regulations_data:
        return
    
    # Prepare data for bulk upsert
    values = []
    for reg in regulations_data:
        if not reg.get("sid"):
            continue  # Skip if no SID
        values.append({
            "sid": reg["sid"],
            "friendly_name": reg.get("friendly_name"),
            "iso_country": reg.get("iso_country"),
            "number_type": reg.get("number_type"),
            "end_user_type": reg.get("end_user_type", "business"),
            "requirements": reg.get("requirements"),
            "url": reg.get("url"),
        })
    
    if not values:
        return
    
    # Use PostgreSQL INSERT ... ON CONFLICT for upsert
    stmt = insert(Regulation).values(values)
    stmt = stmt.on_conflict_do_update(
        index_elements=["sid"],
        set_=dict(
            friendly_name=stmt.excluded.friendly_name,
            iso_country=stmt.excluded.iso_country,
            number_type=stmt.excluded.number_type,
            end_user_type=stmt.excluded.end_user_type,
            requirements=stmt.excluded.requirements,
            url=stmt.excluded.url,
            last_updated=func.now(),
        )
    )
    
    await db.execute(stmt)
    await db.commit()
    
    logger.info(f"Upserted {len(values)} regulations to database")

