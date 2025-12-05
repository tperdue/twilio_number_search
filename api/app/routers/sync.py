"""Sync endpoints for triggering and monitoring Twilio data sync."""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
import uuid

from app.database import get_db_session
from app.config import settings
from app.schemas import SyncRequest, SyncStatus
from app.tasks.sync_task import (
    sync_twilio_number_types,
    get_sync_job_status,
    upsert_countries_to_db,
    sync_twilio_regulations,
    upsert_regulations_to_db,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


def _validate_twilio_credentials():
    """Validate that Twilio credentials are configured."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(
            status_code=500,
            detail="Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
        )


async def run_sync_task(
    account_sid: str,
    auth_token: str,
    job_id: str,
    db: AsyncSession
):
    """Background task wrapper that handles database operations."""
    try:
        # Run the sync task
        countries_data = await sync_twilio_number_types(account_sid, auth_token, job_id)
        
        # Upsert to database
        if countries_data:
            await upsert_countries_to_db(db, countries_data)
            
    except Exception as e:
        logger.error(f"Sync task {job_id} failed: {e}")
        job_status = get_sync_job_status(job_id)
        if job_status:
            job_status["error"] = str(e)
            job_status["status"] = "failed"


async def run_regulations_sync_task(
    account_sid: str,
    auth_token: str,
    job_id: str,
    db: AsyncSession
):
    """Background task wrapper for regulations sync that handles database operations."""
    try:
        # Run the regulations sync task
        regulations_data = await sync_twilio_regulations(account_sid, auth_token, job_id)
        
        # Upsert to database
        if regulations_data:
            await upsert_regulations_to_db(db, regulations_data)
            
    except Exception as e:
        logger.error(f"Regulations sync task {job_id} failed: {e}")
        job_status = get_sync_job_status(job_id)
        if job_status:
            job_status["error"] = str(e)
            job_status["status"] = "failed"


@router.post("", response_model=Dict[str, str], status_code=202)
async def trigger_sync(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Trigger a sync of Twilio number types.
    
    Note: Twilio credentials are loaded from environment variables.
    Request body can be empty.
    
    Returns:
        Job ID for tracking sync status
    """
    # Validate credentials are configured
    _validate_twilio_credentials()
    
    job_id = str(uuid.uuid4())
    
    # Start background task with credentials from settings
    background_tasks.add_task(
        run_sync_task,
        settings.twilio_account_sid,
        settings.twilio_auth_token,
        job_id,
        db
    )
    
    logger.info(f"Started sync job {job_id}")
    
    return {"job_id": job_id, "status": "accepted"}


@router.get("/{job_id}", response_model=SyncStatus)
async def get_sync_status(job_id: str):
    """
    Get status of a sync job.
    
    Args:
        job_id: Job ID returned from trigger_sync
        
    Returns:
        Sync job status
    """
    job_status = get_sync_job_status(job_id)
    
    if not job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return SyncStatus(
        job_id=job_id,
        status=job_status["status"],
        started_at=job_status.get("started_at"),
        completed_at=job_status.get("completed_at"),
        countries_processed=job_status.get("countries_processed", 0),
        countries_total=job_status.get("countries_total"),
        error=job_status.get("error"),
    )


@router.post("/regulations", response_model=Dict[str, str], status_code=202)
async def trigger_regulations_sync(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Trigger a sync of Twilio regulatory compliance regulations.
    
    Note: Twilio credentials are loaded from environment variables.
    Request body can be empty.
    
    Returns:
        Job ID for tracking sync status
    """
    # Validate credentials are configured
    _validate_twilio_credentials()
    
    job_id = str(uuid.uuid4())
    
    # Start background task with credentials from settings
    background_tasks.add_task(
        run_regulations_sync_task,
        settings.twilio_account_sid,
        settings.twilio_auth_token,
        job_id,
        db
    )
    
    logger.info(f"Started regulations sync job {job_id}")
    
    return {"job_id": job_id, "status": "accepted"}


@router.get("", response_model=Dict[str, list])
async def list_sync_jobs(limit: int = 10):
    """
    List recent sync jobs.
    
    Args:
        limit: Maximum number of jobs to return
        
    Returns:
        List of sync job statuses
    """
    from app.tasks.sync_task import sync_jobs
    
    # Get most recent jobs (simple implementation - in production, use proper sorting)
    jobs = list(sync_jobs.items())[-limit:]
    
    return {
        "jobs": [
            {
                "job_id": job_id,
                "status": status["status"],
                "started_at": status.get("started_at"),
                "completed_at": status.get("completed_at"),
                "countries_processed": status.get("countries_processed", 0),
                "countries_total": status.get("countries_total"),
            }
            for job_id, status in jobs
        ]
    }

