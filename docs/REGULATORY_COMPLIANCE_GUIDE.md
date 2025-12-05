# Regulatory Compliance Guide

This guide explains how to use the regulatory compliance features of the Twilio Number Search application. You'll learn how to understand regulations, query them, and use them for compliance workflows.

## Overview

Regulatory compliance is a critical aspect of purchasing phone numbers. Different countries have different requirements for registering phone numbers, and these requirements can vary by:
- Country
- Number type (local, toll-free, mobile, etc.)
- End user type (business, individual)

The application provides access to Twilio's regulatory compliance data, allowing you to:
- Query regulations by country and number type
- Understand required information and documents
- Export regulations as Excel templates
- Plan compliance workflows

## Understanding Regulations

### What Are Regulations?

Regulations are country-specific requirements that must be met before you can purchase and use phone numbers. They define:
- What information you must provide
- What documents you must submit
- Which document types are acceptable
- Specific fields that must be completed

### Regulation Structure

Each regulation contains:

1. **Metadata**:
   - **SID**: Unique identifier (e.g., `RN1234567890abcdef`)
   - **Friendly Name**: Human-readable description
   - **Country**: ISO country code (e.g., "US")
   - **Number Type**: Type of phone number (local, toll-free, mobile, etc.)
   - **End User Type**: Always "business" in this application

2. **Requirements**: A JSON object containing:
   - **End User Requirements**: Information fields you must provide
   - **Supporting Document Requirements**: Documents you must submit

### End User Requirements

These are information fields that must be collected and submitted. Each field includes:
- **Machine Name**: Technical identifier
- **Friendly Name**: Human-readable label
- **Description**: Detailed explanation of what's needed
- **Field Type**: Type of data expected

**Example fields**:
- Business Name
- Business Address
- Tax ID Number
- Contact Person
- Business Registration Number

### Supporting Document Requirements

These are documents that must be provided. Each requirement includes:
- **Name**: Name of the required document
- **Description**: What the document is used for
- **Accepted Documents**: List of document types that satisfy the requirement
  - Each accepted document type may have its own required fields
  - Multiple document types may be accepted (you choose one)

**Example document requirements**:
- Business License
- Proof of Address
- Identity Verification
- Certificate of Incorporation

## Querying Regulations

### By Country Code

Get all regulations for a specific country:

**Endpoint**: `GET /api/v1/regulations/{country_code}`

**Example:**
```bash
curl "http://localhost:8000/api/v1/regulations/US"
```

**Response:**
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

### Filtering by Number Type

Get regulations for a specific number type:

**Endpoint**: `GET /api/v1/regulations/{country_code}?number_type=local`

**Example:**
```bash
curl "http://localhost:8000/api/v1/regulations/US?number_type=local"
```

**Available Number Types**:
- `local`
- `toll_free`
- `mobile`
- `national`
- `voip`
- `shared_cost`
- `machine_to_machine`

### Filtering by Available Types Only

By default, the API returns all regulations, including those for number types that may not be publicly available (private offerings). To only show regulations for publicly available number types:

**Endpoint**: `GET /api/v1/regulations/{country_code}?only_available_types=true`

**Example:**
```bash
curl "http://localhost:8000/api/v1/regulations/US?only_available_types=true"
```

**Note**: This requires number types to be synced first using `POST /api/v1/sync`.

### Via Admin UI

1. Navigate to the "Countries" page
2. Click on a country to view its detail page
3. The regulations tab shows all regulations for that country
4. Use filters to narrow down by number type
5. Click on a regulation card to view details

## Compliance Workflow

### Step 1: Identify Your Needs

Before querying regulations, determine:
- **Country**: Where do you need phone numbers?
- **Number Type**: What type of numbers do you need? (local, toll-free, mobile)
- **Use Case**: What will the numbers be used for?

### Step 2: Query Regulations

Query regulations for your target country and number type:

```bash
# Get all regulations for US local numbers
curl "http://localhost:8000/api/v1/regulations/US?number_type=local"
```

Review the returned regulations to understand requirements.

### Step 3: Understand Requirements

For each relevant regulation:

1. **Review Required Information**:
   - Read through all end user requirement fields
   - Note field descriptions
   - Identify which fields you can provide immediately
   - Identify which fields require additional work

2. **Review Required Documents**:
   - List all required documents
   - For each document, check accepted document types
   - Choose which document type you'll provide (if multiple are accepted)
   - Note any specific fields required for chosen document types

### Step 4: Export and Plan

Export regulations to Excel for detailed planning:

```bash
# Export a single regulation
curl -X GET "http://localhost:8000/api/v1/regulations/RN1234567890abcdef/export" \
  --output compliance_checklist.xlsx
```

Use the Excel template to:
- Create a checklist
- Track what information you've collected
- Document which documents you'll provide
- Share requirements with your team

### Step 5: Collect Information

Using the Excel template or regulation details:

1. **Gather Required Information**:
   - Collect all required end user fields
   - Ensure data is accurate and complete
   - Format data according to field descriptions

2. **Prepare Documents**:
   - Obtain all required documents
   - Ensure documents match accepted document types
   - Complete any required fields on documents
   - Scan/photograph documents if digital submission is required

### Step 6: Submit to Twilio

Once you have all required information and documents:
- Submit through Twilio's console or API
- Reference the regulation SID if needed
- Include all required information and documents
- Monitor submission status

## Required Information

### Understanding Field Types

Regulation fields can be various types:
- **Text**: Free-form text input
- **Date**: Date values
- **Number**: Numeric values
- **Address**: Structured address information
- **File**: Document uploads

### Field Descriptions

Always read field descriptions carefully:
- They explain exactly what's needed
- They may specify format requirements
- They may indicate optional vs required status
- They may provide examples

### Common Required Fields

While requirements vary by country, common fields include:

- **Business Information**:
  - Business Name
  - Business Type
  - Registration Number
  - Tax ID

- **Address Information**:
  - Business Address
  - City, State, Postal Code
  - Country

- **Contact Information**:
  - Contact Person Name
  - Email Address
  - Phone Number

- **Additional Information**:
  - Intended Use Case
  - Volume Estimates
  - Compliance Certifications

## Supporting Documents

### Document Requirements

Each document requirement specifies:
- **What document is needed**: Name and description
- **Why it's needed**: Purpose of the document
- **What's acceptable**: List of accepted document types

### Accepted Document Types

When multiple document types are accepted, you typically only need to provide ONE. Common accepted types include:

- **Business License**: Official business registration
- **Certificate of Incorporation**: Corporate registration document
- **Tax Certificate**: Tax registration or exemption certificate
- **Proof of Address**: Utility bill, lease, etc.
- **Identity Document**: Government-issued ID
- **Bank Statement**: Proof of business banking

### Document-Specific Fields

Some document types require specific fields to be completed:
- Document number
- Issue date
- Expiration date
- Issuing authority
- Additional metadata

Check the regulation details for field requirements for your chosen document type.

### Document Quality

Ensure documents are:
- **Clear**: Legible and high quality
- **Current**: Not expired (if applicable)
- **Official**: From recognized authorities
- **Complete**: All pages if multi-page documents
- **Authentic**: Original or certified copies

## Best Practices

### Before Starting

1. **Sync Regulations First**: Always sync regulations before querying to ensure you have the latest data
2. **Query Early**: Query regulations as early as possible in your planning process
3. **Export Templates**: Export Excel templates for detailed planning and tracking

### During Collection

1. **Use Checklists**: Use exported Excel templates as checklists
2. **Document Everything**: Keep records of what you've collected
3. **Verify Requirements**: Double-check requirements before submitting
4. **Prepare in Advance**: Start collecting information early

### Multi-Country Operations

1. **Compare Requirements**: Export regulations for multiple countries to compare requirements
2. **Identify Common Requirements**: Find fields/documents needed across multiple countries
3. **Plan Resources**: Allocate resources based on complexity
4. **Prioritize**: Focus on countries with simpler requirements first

### Compliance Management

1. **Centralize Documentation**: Keep all compliance documents in one place
2. **Version Control**: Track regulation changes over time
3. **Regular Updates**: Re-sync regulations periodically
4. **Team Training**: Ensure your team understands requirements

### Error Prevention

1. **Read Carefully**: Read all field descriptions and document requirements
2. **Verify Data**: Double-check all information before submission
3. **Complete All Fields**: Don't skip optional fields if you have the data
4. **Follow Formats**: Adhere to specified data formats

## Troubleshooting

### No Regulations Found

**Possible Causes**:
- Regulations not synced yet
- Country code incorrect
- No regulations exist for that country/type combination

**Solutions**:
1. Run regulations sync: `POST /api/v1/sync/regulations`
2. Verify country code format (2-letter ISO code, uppercase)
3. Try querying without number type filter
4. Check if country has any regulations at all

### Missing Required Information

**Possible Causes**:
- Regulation data incomplete
- Sync didn't complete successfully
- Regulation structure changed

**Solutions**:
1. Re-sync regulations
2. Check regulation URL in response for official Twilio documentation
3. Contact Twilio support if data seems incorrect

### Conflicting Requirements

**Possible Causes**:
- Multiple regulations apply
- Regulations updated
- Different number types have different requirements

**Solutions**:
1. Review all applicable regulations
2. Export all relevant regulations to compare
3. Contact Twilio support for clarification
4. Follow the most restrictive requirements to be safe

## Related Documentation

- [Excel Export Guide](./EXCEL_EXPORT_GUIDE.md) - Exporting regulations as Excel templates
- [Sync Workflow](./SYNC_WORKFLOW.md) - Syncing regulation data
- [API Usage Guide](./API_USAGE_GUIDE.md) - API endpoint details
- [Database Schema](./DATABASE_SCHEMA.md) - Understanding regulation data structure
