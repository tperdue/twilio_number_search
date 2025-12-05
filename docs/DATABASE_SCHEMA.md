# Database Schema

This document describes the database schema for the Twilio Number Search application. The database uses PostgreSQL and stores synced data from Twilio's API.

## Overview

The database consists of two main tables:
- `country_number_types`: Stores country information and available phone number types
- `regulations`: Stores regulatory compliance regulations with their requirements

Both tables are populated through sync operations that fetch data from Twilio's API.

## Schema Overview

```
┌─────────────────────────┐
│ country_number_types     │
├─────────────────────────┤
│ country_code (PK)       │
│ country                 │
│ beta                    │
│ local                   │
│ toll_free               │
│ mobile                  │
│ national                │
│ voip                    │
│ shared_cost             │
│ machine_to_machine      │
│ last_updated            │
└─────────────────────────┘

┌─────────────────────────┐
│ regulations              │
├─────────────────────────┤
│ sid (PK)                │
│ friendly_name           │
│ iso_country             │
│ number_type             │
│ end_user_type           │
│ requirements (JSON)      │
│ url                     │
│ last_updated            │
└─────────────────────────┘
```

## Tables

### country_number_types

Stores information about which phone number types are available in each country.

**Primary Key**: `country_code`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `country_code` | VARCHAR(2) | PRIMARY KEY, NOT NULL, INDEXED | ISO 2-letter country code (e.g., "US", "GB") |
| `country` | VARCHAR(255) | NOT NULL | Full country name (e.g., "United States") |
| `beta` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether the country is in beta status |
| `local` | BOOLEAN | NOT NULL, DEFAULT FALSE | Local numbers available |
| `toll_free` | BOOLEAN | NOT NULL, DEFAULT FALSE | Toll-free numbers available |
| `mobile` | BOOLEAN | NOT NULL, DEFAULT FALSE | Mobile numbers available |
| `national` | BOOLEAN | NOT NULL, DEFAULT FALSE | National numbers available |
| `voip` | BOOLEAN | NOT NULL, DEFAULT FALSE | VoIP numbers available |
| `shared_cost` | BOOLEAN | NOT NULL, DEFAULT FALSE | Shared cost numbers available |
| `machine_to_machine` | BOOLEAN | NOT NULL, DEFAULT FALSE | Machine-to-machine numbers available |
| `last_updated` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Timestamp of last update |

**Indexes**:
- Primary key index on `country_code`

**Example Data**:
```sql
country_code | country        | beta | local | toll_free | mobile | ...
-------------|---------------|------|-------|-----------|--------|-----
US           | United States | false| true  | true      | true   | ...
GB           | United Kingdom| false| true  | false     | true   | ...
```

### regulations

Stores regulatory compliance regulations with their detailed requirements.

**Primary Key**: `sid`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sid` | VARCHAR(34) | PRIMARY KEY, NOT NULL, INDEXED | Unique regulation identifier from Twilio (e.g., "RN1234567890abcdef...") |
| `friendly_name` | VARCHAR(255) | NULLABLE | Human-readable description of the regulation |
| `iso_country` | VARCHAR(2) | NULLABLE, INDEXED | ISO 2-letter country code |
| `number_type` | VARCHAR(50) | NULLABLE | Type of phone number (local, toll_free, mobile, etc.) |
| `end_user_type` | VARCHAR(20) | NOT NULL, DEFAULT 'business' | Type of end user (always "business" in this application) |
| `requirements` | JSONB | NULLABLE | JSON object containing regulatory requirements |
| `url` | VARCHAR(500) | NULLABLE | Absolute URL of the Regulation resource on Twilio |
| `last_updated` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Timestamp of last update |

**Indexes**:
- Primary key index on `sid`
- Index on `iso_country` for country-based queries

**Example Data**:
```sql
sid                          | friendly_name      | iso_country | number_type | end_user_type | ...
-----------------------------|--------------------|-------------|-------------|---------------|-----
RN1234567890abcdef...        | US Local Business  | US          | local       | business      | ...
RN0987654321fedcba...        | US Toll-Free       | US          | toll_free   | business      | ...
```

## Data Types

### Boolean Fields

All number type availability fields in `country_number_types` are booleans:
- `true`: Number type is available
- `false`: Number type is not available

### JSON Structure

The `requirements` column in `regulations` stores a JSONB object with the following structure:

```json
{
  "end_user": [
    {
      "detailed_fields": [
        {
          "machine_name": "business_name",
          "friendly_name": "Business Name",
          "description": "The legal name of your business",
          "field_type": "text"
        }
      ]
    }
  ],
  "supporting_document": [
    [
      {
        "name": "Business License",
        "description": "Official business registration document",
        "accepted_documents": [
          {
            "name": "Certificate of Incorporation",
            "detailed_fields": [
              {
                "machine_name": "document_number",
                "friendly_name": "Document Number",
                "description": "Registration number on the certificate"
              }
            ]
          }
        ]
      }
    ]
  ]
}
```

## Relationships

### Implicit Relationships

While there are no explicit foreign key constraints, the tables have logical relationships:

1. **Country Relationship**: 
   - `regulations.iso_country` relates to `country_number_types.country_code`
   - Used for filtering regulations by available number types

2. **Number Type Relationship**:
   - `regulations.number_type` relates to boolean columns in `country_number_types`
   - Used to determine which regulations apply to available number types

## Data Flow

### How Data Enters

1. **Sync Operations**:
   - Number Types Sync (`POST /api/v1/sync`): Populates `country_number_types`
   - Regulations Sync (`POST /api/v1/sync/regulations`): Populates `regulations`

2. **Upsert Logic**:
   - Both syncs use PostgreSQL's `INSERT ... ON CONFLICT DO UPDATE`
   - Existing records are updated, new records are inserted
   - `last_updated` timestamp is automatically updated

### How Data is Queried

1. **Country Queries**:
   - `GET /api/v1/countries`: Lists all countries
   - `GET /api/v1/countries/{country_code}`: Gets specific country

2. **Regulation Queries**:
   - `GET /api/v1/regulations/{country_code}`: Gets regulations for a country
   - Can filter by `number_type` and `only_available_types`

3. **Number Search**:
   - `POST /api/v1/numbers/search`: Queries Twilio API directly (not from database)

## JSON Structures

### Requirements Object

The `requirements` JSONB column contains:

```typescript
{
  end_user?: Array<{
    detailed_fields: Array<{
      machine_name: string;
      friendly_name: string;
      description?: string;
      field_type?: string;
    }>;
  }>;
  supporting_document?: Array<Array<{
    name: string;
    description?: string;
    accepted_documents?: Array<{
      name: string;
      detailed_fields?: Array<{
        machine_name: string;
        friendly_name: string;
        description?: string;
      }>;
    }>;
  }>>;
}
```

### End User Requirements

Stored in `requirements.end_user`:
- Array of requirement objects
- Each contains `detailed_fields` array
- Fields specify what information must be collected

### Supporting Document Requirements

Stored in `requirements.supporting_document`:
- Nested array structure (array of arrays)
- Outer array may contain multiple document groups
- Inner arrays contain document requirements
- Each document requirement has:
  - `name`: Document name
  - `description`: What the document is for
  - `accepted_documents`: List of acceptable document types
    - Each accepted document may have its own `detailed_fields`

## Example Queries

### Get All Countries with Local Numbers

```sql
SELECT country_code, country, local
FROM country_number_types
WHERE local = true
ORDER BY country;
```

### Get Regulations for a Country

```sql
SELECT sid, friendly_name, number_type
FROM regulations
WHERE iso_country = 'US'
  AND end_user_type = 'business'
ORDER BY number_type;
```

### Get Regulations for Available Number Types Only

```sql
SELECT r.sid, r.friendly_name, r.number_type
FROM regulations r
JOIN country_number_types c ON r.iso_country = c.country_code
WHERE r.iso_country = 'US'
  AND r.end_user_type = 'business'
  AND (
    (r.number_type = 'local' AND c.local = true) OR
    (r.number_type = 'toll_free' AND c.toll_free = true) OR
    (r.number_type = 'mobile' AND c.mobile = true) OR
    r.number_type IS NULL
  );
```

### Query JSON Requirements

```sql
-- Get all end user field names for a regulation
SELECT 
  sid,
  friendly_name,
  jsonb_array_elements(
    requirements->'end_user'
  )->'detailed_fields' as fields
FROM regulations
WHERE sid = 'RN1234567890abcdef...';
```

### Count Regulations by Country

```sql
SELECT 
  iso_country,
  COUNT(*) as regulation_count
FROM regulations
WHERE end_user_type = 'business'
GROUP BY iso_country
ORDER BY regulation_count DESC;
```

### Find Countries with Most Number Types

```sql
SELECT 
  country_code,
  country,
  (CASE WHEN local THEN 1 ELSE 0 END +
   CASE WHEN toll_free THEN 1 ELSE 0 END +
   CASE WHEN mobile THEN 1 ELSE 0 END +
   CASE WHEN national THEN 1 ELSE 0 END +
   CASE WHEN voip THEN 1 ELSE 0 END +
   CASE WHEN shared_cost THEN 1 ELSE 0 END +
   CASE WHEN machine_to_machine THEN 1 ELSE 0 END) as type_count
FROM country_number_types
ORDER BY type_count DESC;
```

## Data Retention

### Current Behavior

- Data is updated in place (upsert) during syncs
- No automatic deletion of old data
- `last_updated` timestamp tracks when records were last modified

### Considerations

1. **Regulation Changes**: Regulations may be updated or removed by Twilio
   - Current implementation updates existing records
   - Removed regulations remain in database (not deleted)

2. **Country Changes**: Countries may be added or number types may change
   - New countries are added
   - Existing countries are updated with new number type availability

3. **Cleanup**: Consider implementing cleanup logic for:
   - Regulations that no longer exist in Twilio
   - Countries that are no longer supported

## Indexes

### Existing Indexes

1. **Primary Key Indexes**:
   - `country_number_types.country_code` (PRIMARY KEY)
   - `regulations.sid` (PRIMARY KEY)

2. **Foreign Key-like Indexes**:
   - `regulations.iso_country` (for country-based queries)

### Recommended Additional Indexes

For better query performance, consider:

```sql
-- Index for filtering regulations by number type
CREATE INDEX idx_regulations_number_type 
ON regulations(number_type) 
WHERE number_type IS NOT NULL;

-- Index for filtering regulations by country and type
CREATE INDEX idx_regulations_country_type 
ON regulations(iso_country, number_type) 
WHERE iso_country IS NOT NULL;

-- GIN index for JSON queries (if querying requirements frequently)
CREATE INDEX idx_regulations_requirements_gin 
ON regulations USING GIN (requirements);
```

## Constraints

### Current Constraints

- Primary key constraints on `country_code` and `sid`
- NOT NULL constraints on required fields
- Default values for boolean fields and timestamps

### Potential Additional Constraints

Consider adding:

```sql
-- Check constraint for country code format
ALTER TABLE country_number_types
ADD CONSTRAINT check_country_code_format 
CHECK (country_code ~ '^[A-Z]{2}$');

-- Check constraint for regulation SID format
ALTER TABLE regulations
ADD CONSTRAINT check_sid_format 
CHECK (sid ~ '^RN[a-zA-Z0-9]{32}$');
```

## Migration Considerations

### Current Implementation

- Tables are created automatically using SQLAlchemy metadata
- No formal migration system (Alembic) in place

### Production Recommendations

1. **Use Alembic**: Implement Alembic for proper migrations
2. **Version Control**: Track schema changes in version control
3. **Backward Compatibility**: Ensure migrations are backward compatible
4. **Testing**: Test migrations on staging before production

## Related Documentation

- [Sync Workflow](./SYNC_WORKFLOW.md) - How data is synced to these tables
- [Regulatory Compliance Guide](./REGULATORY_COMPLIANCE_GUIDE.md) - Using regulation data
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Database configuration for production
