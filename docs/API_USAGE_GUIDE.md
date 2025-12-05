# API Usage Guide

This guide provides practical examples and common use cases for the Twilio Number Search API. It covers authentication, endpoints, error handling, and integration patterns.

## Overview

The API is a RESTful service built with FastAPI, providing endpoints for:
- Searching available phone numbers
- Querying country and number type information
- Accessing regulatory compliance regulations
- Synchronizing data from Twilio
- Exporting regulations as Excel files

**Base URL**: `http://localhost:8000` (development) or your production URL

**API Version**: All endpoints are prefixed with `/api/v1`

## Authentication

The API uses Twilio credentials configured via environment variables. No authentication headers are required for API requests, but Twilio credentials must be configured for operations that interact with Twilio's API.

**Required Environment Variables**:
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token

These are set in your `.env` file and loaded automatically by the application.

## Common Use Cases

### 1. Search for Available Phone Numbers

Search for available phone numbers by country, number type, and capabilities.

**Endpoint**: `POST /api/v1/numbers/search`

**Request Body**:
```json
{
  "country_code": "US",
  "number_type": "local",
  "sms_enabled": true,
  "voice_enabled": true
}
```

**Example (curl)**:
```bash
curl -X POST "http://localhost:8000/api/v1/numbers/search" \
  -H "Content-Type: application/json" \
  -d '{
    "country_code": "US",
    "number_type": "local",
    "sms_enabled": true,
    "voice_enabled": true
  }'
```

**Example (Python)**:
```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/numbers/search",
    json={
        "country_code": "US",
        "number_type": "local",
        "sms_enabled": True,
        "voice_enabled": True
    }
)

numbers = response.json()
for number in numbers:
    print(f"{number['phone_number']} - {number['locality']}, {number['region']}")
```

**Example (JavaScript)**:
```javascript
const response = await fetch('http://localhost:8000/api/v1/numbers/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    country_code: 'US',
    number_type: 'local',
    sms_enabled: true,
    voice_enabled: true
  })
});

const numbers = await response.json();
numbers.forEach(number => {
  console.log(`${number.phone_number} - ${number.locality}, ${number.region}`);
});
```

**Response**:
```json
[
  {
    "phone_number": "+1234567890",
    "friendly_name": "+1234567890",
    "capabilities": {
      "mms": false,
      "sms": true,
      "voice": true,
      "fax": false
    },
    "iso_country": "US",
    "address_requirements": "none",
    "beta": false,
    "lata": "123",
    "locality": "New York",
    "rate_center": "NYC",
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "region": "NY",
    "postal_code": "10001"
  }
]
```

**Number Types**:
- `mobile`: Mobile numbers
- `local`: Local numbers
- `toll-free`: Toll-free numbers

**Capability Filters**:
- `sms_enabled`: Filter by SMS capability (true/false)
- `voice_enabled`: Filter by Voice capability (true/false)
- **Note**: When both are specified, filters use AND logic (must match both)

### 2. List Countries and Number Types

Get a list of all countries with their available number types.

**Endpoint**: `GET /api/v1/countries`

**Query Parameters**:
- `skip`: Pagination offset (default: 0)
- `limit`: Maximum results (default: 100, max: 1000)
- `number_type`: Filter by number type (optional)

**Example**:
```bash
curl "http://localhost:8000/api/v1/countries?limit=10&number_type=local"
```

**Response**:
```json
[
  {
    "country_code": "US",
    "country": "United States",
    "beta": false,
    "local": true,
    "toll_free": true,
    "mobile": true,
    "national": false,
    "voip": false,
    "shared_cost": false,
    "machine_to_machine": false,
    "last_updated": "2024-01-15T10:00:00Z"
  }
]
```

### 3. Get Country Details

Get number types for a specific country.

**Endpoint**: `GET /api/v1/countries/{country_code}`

**Example**:
```bash
curl "http://localhost:8000/api/v1/countries/US"
```

### 4. Query Regulations

Get regulatory compliance regulations for a country.

**Endpoint**: `GET /api/v1/regulations/{country_code}`

**Query Parameters**:
- `number_type`: Filter by number type (optional)
- `only_available_types`: Only show regulations for available types (default: false)

**Example**:
```bash
curl "http://localhost:8000/api/v1/regulations/US?number_type=local"
```

**Response**:
```json
[
  {
    "sid": "RN1234567890abcdef",
    "friendly_name": "US Local Business",
    "iso_country": "US",
    "number_type": "local",
    "end_user_type": "business",
    "requirements": {
      "end_user": [...],
      "supporting_document": [...]
    },
    "url": "https://...",
    "last_updated": "2024-01-15T10:00:00Z"
  }
]
```

### 5. Export Regulation to Excel

Export a single regulation as an Excel template.

**Endpoint**: `GET /api/v1/regulations/{regulation_sid}/export`

**Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/regulations/RN1234567890abcdef/export" \
  --output regulation.xlsx
```

**Python Example**:
```python
import requests

response = requests.get(
    "http://localhost:8000/api/v1/regulations/RN1234567890abcdef/export"
)

with open('regulation.xlsx', 'wb') as f:
    f.write(response.content)
```

### 6. Export Multiple Regulations

Export multiple regulations as a multi-tab Excel file.

**Endpoint**: `POST /api/v1/regulations/export`

**Request Body**:
```json
{
  "regulation_sids": [
    "RN1234567890abcdef",
    "RN0987654321fedcba"
  ]
}
```

**Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/regulations/export" \
  -H "Content-Type: application/json" \
  -d '{"regulation_sids": ["RN1234567890abcdef", "RN0987654321fedcba"]}' \
  --output regulations.xlsx
```

### 7. Trigger Data Sync

Trigger synchronization of country and number type data.

**Endpoint**: `POST /api/v1/sync`

**Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/sync"
```

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "accepted"
}
```

### 8. Trigger Regulations Sync

Trigger synchronization of regulatory compliance data.

**Endpoint**: `POST /api/v1/sync/regulations`

**Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/sync/regulations"
```

### 9. Check Sync Job Status

Monitor the status of a sync job.

**Endpoint**: `GET /api/v1/sync/{job_id}`

**Example**:
```bash
curl "http://localhost:8000/api/v1/sync/550e8400-e29b-41d4-a716-446655440000"
```

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z",
  "countries_processed": 200,
  "countries_total": 200,
  "error": null
}
```

### 10. List Recent Sync Jobs

Get a list of recent sync jobs.

**Endpoint**: `GET /api/v1/sync?limit=10`

**Example**:
```bash
curl "http://localhost:8000/api/v1/sync?limit=10"
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Request successful
- **202 Accepted**: Request accepted (async operations like sync)
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Response Format

Errors return JSON with a `detail` field:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Errors

#### Invalid Number Type

**Status**: 400

**Response**:
```json
{
  "detail": "Invalid number type. Must be one of: local, toll_free, mobile, ..."
}
```

#### Country Not Found

**Status**: 404

**Response**:
```json
{
  "detail": "Country US not found"
}
```

#### Regulations Not Found

**Status**: 404

**Response**:
```json
{
  "detail": "No regulations found for country US. Sync regulations first using POST /api/v1/sync/regulations"
}
```

#### Twilio Credentials Not Configured

**Status**: 500

**Response**:
```json
{
  "detail": "Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
}
```

#### Twilio API Error

**Status**: 400

**Response**:
```json
{
  "detail": "Twilio API error: [error message]"
}
```

#### Rate Limit Exceeded

**Status**: 429

**Response**:
```json
{
  "detail": "Twilio rate limit exceeded. Please try again later."
}
```

### Error Handling Examples

**Python**:
```python
import requests

try:
    response = requests.post(
        "http://localhost:8000/api/v1/numbers/search",
        json={"country_code": "US", "number_type": "local"}
    )
    response.raise_for_status()
    numbers = response.json()
except requests.exceptions.HTTPError as e:
    error_detail = e.response.json().get('detail', 'Unknown error')
    print(f"Error: {error_detail}")
```

**JavaScript**:
```javascript
try {
  const response = await fetch('http://localhost:8000/api/v1/numbers/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country_code: 'US', number_type: 'local' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Unknown error');
  }
  
  const numbers = await response.json();
} catch (error) {
  console.error('Error:', error.message);
}
```

## Rate Limiting

The API respects Twilio's rate limits when making requests to Twilio's API. For operations that query the local database (countries, regulations), there are no rate limits.

**Best Practices**:
- Cache results when possible
- Use pagination for large result sets
- Implement exponential backoff for retries
- Monitor rate limit responses (429 status)

## Integration Patterns

### Complete Workflow Example

Here's a complete example of finding numbers and checking regulations:

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# 1. List countries with local numbers
countries = requests.get(f"{BASE_URL}/countries?number_type=local").json()
print(f"Found {len(countries)} countries with local numbers")

# 2. Search for numbers in US
numbers = requests.post(
    f"{BASE_URL}/numbers/search",
    json={"country_code": "US", "number_type": "local", "sms_enabled": True}
).json()
print(f"Found {len(numbers)} available numbers")

# 3. Get regulations for US
regulations = requests.get(f"{BASE_URL}/regulations/US?number_type=local").json()
print(f"Found {len(regulations)} regulations")

# 4. Export first regulation
if regulations:
    regulation_sid = regulations[0]["sid"]
    excel = requests.get(f"{BASE_URL}/regulations/{regulation_sid}/export")
    with open("compliance_checklist.xlsx", "wb") as f:
        f.write(excel.content)
    print("Exported compliance checklist")
```

### Polling Sync Status

```python
import requests
import time

def wait_for_sync_completion(job_id, timeout=600):
    """Wait for sync job to complete."""
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        response = requests.get(f"http://localhost:8000/api/v1/sync/{job_id}")
        status = response.json()
        
        if status["status"] == "completed":
            return status
        elif status["status"] == "failed":
            raise Exception(f"Sync failed: {status.get('error')}")
        
        time.sleep(2)  # Poll every 2 seconds
    
    raise TimeoutError("Sync did not complete within timeout")

# Trigger sync
response = requests.post("http://localhost:8000/api/v1/sync")
job_id = response.json()["job_id"]

# Wait for completion
status = wait_for_sync_completion(job_id)
print(f"Sync completed: {status['countries_processed']}/{status['countries_total']}")
```

### Batch Processing

```python
import requests
from concurrent.futures import ThreadPoolExecutor

def get_regulations(country_code):
    """Get regulations for a country."""
    try:
        response = requests.get(
            f"http://localhost:8000/api/v1/regulations/{country_code}"
        )
        return country_code, response.json()
    except Exception as e:
        return country_code, None

# Get all countries
countries = requests.get("http://localhost:8000/api/v1/countries").json()
country_codes = [c["country_code"] for c in countries]

# Fetch regulations for all countries in parallel
with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(get_regulations, country_codes)

for country_code, regulations in results:
    if regulations:
        print(f"{country_code}: {len(regulations)} regulations")
```

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide:
- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication information

## Health Check

Check if the API is running:

**Endpoint**: `GET /health`

**Example**:
```bash
curl "http://localhost:8000/health"
```

**Response**:
```json
{
  "status": "healthy"
}
```

## Related Documentation

- [Sync Workflow](./SYNC_WORKFLOW.md) - Detailed sync operations guide
- [Regulatory Compliance Guide](./REGULATORY_COMPLIANCE_GUIDE.md) - Understanding regulations
- [Excel Export Guide](./EXCEL_EXPORT_GUIDE.md) - Exporting regulations
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production API considerations
