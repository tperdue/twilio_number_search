# Sync Workflow Guide

The Twilio Number Search application synchronizes data from Twilio's API to a local PostgreSQL database. This guide explains how the sync process works, when to run syncs, and how to monitor sync jobs.

## Overview

Data synchronization is essential for the application to function properly. The application stores two types of data:

1. **Country Number Types**: Information about which phone number types (local, toll-free, mobile, etc.) are available in each country
2. **Regulatory Compliance Regulations**: Country-specific regulatory requirements for phone number registration

Both types of data are fetched from Twilio's API and stored locally for fast querying and to reduce API calls.

## Sync Types

The application supports two distinct sync operations:

### 1. Number Types Sync

**Endpoint**: `POST /api/v1/sync`

**Purpose**: Synchronizes country information and available phone number types.

**What Gets Synced**:
- List of all countries supported by Twilio
- For each country:
  - Country name and code
  - Available number types (local, toll-free, mobile, national, VoIP, shared cost, machine-to-machine)
  - Beta status

**When to Run**:
- Initial setup (required before using the application)
- When you need updated country/number type information
- Periodically (e.g., monthly) to catch new countries or number types

### 2. Regulations Sync

**Endpoint**: `POST /api/v1/sync/regulations`

**Purpose**: Synchronizes regulatory compliance regulations for all countries.

**What Gets Synced**:
- For each country:
  - All business regulations
  - Regulation details including:
    - Required information fields
    - Required supporting documents
    - Accepted document types
    - Field descriptions and requirements

**When to Run**:
- Initial setup (required before querying regulations)
- When you need updated regulatory information
- Periodically (e.g., monthly) as regulations can change
- Before exporting regulations to Excel

## Running Syncs

### Via API

#### Trigger Number Types Sync

```bash
POST /api/v1/sync
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/sync"
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "accepted"
}
```

#### Trigger Regulations Sync

```bash
POST /api/v1/sync/regulations
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/sync/regulations"
```

**Response:**
```json
{
  "job_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "accepted"
}
```

### Via Admin UI

1. Navigate to the "Sync Management" page
2. Choose the sync type:
   - Click "Sync Number Types" for country/number type sync
   - Click "Sync Regulations" for regulatory compliance sync
3. The sync will start in the background
4. Monitor progress using the job status display

### Authentication

Sync operations use Twilio credentials from environment variables:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

These must be configured in your `.env` file before running syncs.

## Monitoring Sync Jobs

Sync operations run as background tasks and return immediately with a job ID. You can monitor the progress using the job ID.

### Check Job Status

**Endpoint**: `GET /api/v1/sync/{job_id}`

**Example:**
```bash
curl "http://localhost:8000/api/v1/sync/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": null,
  "countries_processed": 45,
  "countries_total": 200,
  "error": null
}
```

**Status Values**:
- `pending`: Job is queued but not started
- `in_progress`: Job is currently running
- `completed`: Job finished successfully
- `failed`: Job encountered an error

### List Recent Sync Jobs

**Endpoint**: `GET /api/v1/sync?limit=10`

**Example:**
```bash
curl "http://localhost:8000/api/v1/sync?limit=10"
```

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "started_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:35:00Z",
      "countries_processed": 200,
      "countries_total": 200
    },
    {
      "job_id": "440e8400-e29b-41d4-a716-446655440001",
      "status": "failed",
      "started_at": "2024-01-15T09:00:00Z",
      "completed_at": "2024-01-15T09:01:00Z",
      "countries_processed": 0,
      "countries_total": null
    }
  ]
}
```

### Via Admin UI

The Sync Management page displays:
- Recent sync jobs with their status
- Progress indicators for in-progress jobs
- Error messages for failed jobs
- Ability to trigger new syncs

## Data Synchronized

### Country Number Types

The number types sync stores data in the `country_number_types` table:

- **country_code**: ISO 2-letter country code (primary key)
- **country**: Country name
- **beta**: Whether the country is in beta
- **local**: Local numbers available
- **toll_free**: Toll-free numbers available
- **mobile**: Mobile numbers available
- **national**: National numbers available
- **voip**: VoIP numbers available
- **shared_cost**: Shared cost numbers available
- **machine_to_machine**: Machine-to-machine numbers available
- **last_updated**: Timestamp of last update

### Regulatory Compliance Regulations

The regulations sync stores data in the `regulations` table:

- **sid**: Unique regulation identifier (primary key)
- **friendly_name**: Human-readable regulation name
- **iso_country**: ISO 2-letter country code
- **number_type**: Type of phone number (local, toll-free, mobile, etc.)
- **end_user_type**: Always "business" in this application
- **requirements**: JSON object containing:
  - `end_user`: Array of required information fields
  - `supporting_document`: Array of required document requirements
- **url**: Link to Twilio's regulation resource
- **last_updated**: Timestamp of last update

## Sync Process Details

### How Syncs Work

1. **Job Creation**: When you trigger a sync, a unique job ID is generated
2. **Background Processing**: The sync runs asynchronously in the background
3. **API Calls**: The application makes concurrent API calls to Twilio (limited to 10 concurrent requests)
4. **Data Processing**: Fetched data is processed and prepared for database storage
5. **Database Upsert**: Data is upserted (insert or update) to the database using PostgreSQL's `ON CONFLICT` clause
6. **Status Updates**: Job status is updated throughout the process

### Performance Considerations

- **Concurrency**: Syncs use a semaphore to limit concurrent API calls (10 at a time) to avoid rate limiting
- **Batch Operations**: Data is processed in batches for efficiency
- **Upsert Logic**: Existing records are updated, new records are inserted
- **Duration**: Sync duration depends on:
  - Number of countries (typically 200+)
  - API response times
  - Network latency

**Typical Sync Times**:
- Number Types Sync: 2-5 minutes
- Regulations Sync: 5-15 minutes (more data per country)

## Sync Frequency Recommendations

### Initial Setup

1. Run Number Types Sync first
2. Then run Regulations Sync
3. Verify data is present by querying countries and regulations

### Ongoing Maintenance

- **Number Types**: Sync monthly or when you notice missing countries
- **Regulations**: Sync monthly or before major compliance activities
- **Before Exports**: Always sync regulations before exporting to Excel to ensure you have the latest requirements

### Automated Syncs

For production environments, consider setting up automated syncs:
- Use a cron job or scheduled task
- Call the sync endpoints via HTTP
- Monitor job status and alert on failures
- Log sync results for auditing

## Troubleshooting

### Sync Fails Immediately

**Possible Causes**:
- Twilio credentials not configured
- Invalid credentials
- Network connectivity issues

**Solutions**:
1. Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in `.env`
2. Test credentials using Twilio's API directly
3. Check API logs: `docker-compose logs api`

### Sync Stuck in "in_progress"

**Possible Causes**:
- Long-running sync (normal for regulations sync)
- Process crashed
- Database connection lost

**Solutions**:
1. Check job status - look at `countries_processed` vs `countries_total`
2. Review API logs for errors
3. If truly stuck, wait for timeout or restart the API service
4. Check database connectivity

### Partial Data Synced

**Possible Causes**:
- Some countries failed to sync
- Rate limiting from Twilio
- Network interruptions

**Solutions**:
1. Check the `countries_processed` count
2. Review error messages in job status
3. Re-run the sync - it will update existing records and add missing ones
4. Check Twilio rate limits and adjust concurrency if needed

### Database Errors

**Possible Causes**:
- Database connection issues
- Schema mismatches
- Disk space issues

**Solutions**:
1. Verify database is running: `docker-compose ps db`
2. Check database logs: `docker-compose logs db`
3. Ensure database has sufficient disk space
4. Verify database schema matches models

### Rate Limiting

**Symptoms**:
- Sync fails with 429 status code
- Some countries fail to sync

**Solutions**:
1. Wait before retrying (Twilio rate limits reset)
2. Reduce concurrency in `sync_task.py` (currently 10)
3. Implement exponential backoff
4. Contact Twilio support for higher rate limits if needed

## Best Practices

1. **Run Syncs During Off-Peak Hours**: Syncs can be resource-intensive
2. **Monitor First Sync**: Watch the first sync to understand timing and potential issues
3. **Keep Credentials Secure**: Never commit credentials to version control
4. **Log Sync Results**: Track sync success/failure for auditing
5. **Sync Before Critical Operations**: Always sync before exporting regulations or making compliance decisions
6. **Handle Failures Gracefully**: Implement retry logic for production use
7. **Regular Maintenance**: Set up scheduled syncs to keep data current

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Understanding the database structure
- [Regulatory Compliance Guide](./REGULATORY_COMPLIANCE_GUIDE.md) - Using synced regulation data
- [API Usage Guide](./API_USAGE_GUIDE.md) - API endpoint details
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production sync considerations
