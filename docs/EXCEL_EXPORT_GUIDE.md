# Excel Export Guide

The Twilio Number Search application provides Excel export functionality for regulatory compliance regulations. This feature allows you to export regulation requirements as structured Excel templates that can be used as checklists for compliance workflows.

## Overview

The Excel export feature generates formatted Excel workbooks (.xlsx) containing:
- Regulation metadata (name, country, number type, end user type)
- Required information fields with descriptions
- Required document requirements with accepted document types
- Field-level details for data collection

Each exported file is designed to be used as a compliance checklist, with empty value columns where you can enter the required information.

## Exporting Regulations

### Single Regulation Export

You can export a single regulation in two ways:

#### Via API

```bash
GET /api/v1/regulations/{regulation_sid}/export
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/regulations/RN1234567890abcdef/export" \
  --output regulation.xlsx
```

#### Via Admin UI

1. Navigate to a country's detail page
2. Find the regulation you want to export
3. Click the "Export" button on the regulation card
4. The Excel file will download automatically

### Multiple Regulations Export (Bulk Export)

You can export multiple regulations as a single Excel file with one worksheet per regulation:

#### Via API

```bash
POST /api/v1/regulations/export
Content-Type: application/json

{
  "regulation_sids": [
    "RN1234567890abcdef",
    "RN0987654321fedcba",
    "RNabcdef1234567890"
  ]
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/regulations/export" \
  -H "Content-Type: application/json" \
  -d '{"regulation_sids": ["RN1234567890abcdef", "RN0987654321fedcba"]}' \
  --output regulations_export.xlsx
```

#### Via Admin UI

1. Navigate to a country's detail page
2. Select multiple regulations using the checkboxes
3. Click "Export Selected" in the selected regulations sidebar
4. The Excel file will download with all selected regulations

## Understanding the Excel Template

Each exported Excel file contains one or more worksheets, with each worksheet representing a single regulation. The template structure is as follows:

### Header Section

The first three rows contain regulation metadata:

1. **Row 1**: Regulation friendly name (blue header background)
2. **Row 2**: Country, Number Type, and End User Type information
3. **Row 3**: Last updated timestamp

### Required Information Section

This section lists all required end user information fields:

- **Section Header**: "Required Information" (light blue background)
- **Table Structure**:
  - **Column A**: Field Name (the name of the required field)
  - **Column B**: Description (detailed description of what information is needed)
  - **Column C**: Value (empty column for you to enter the required information)

**Example fields might include:**
- Business Name
- Business Address
- Tax ID Number
- Contact Information
- etc.

### Required Documents Section

This section lists all supporting document requirements:

- **Section Header**: "Required Documents" (light blue background)
- **Document Requirements**: Each document requirement includes:
  - **Document Name**: The name of the required document (gray background)
  - **Description**: What the document is used for (if available)
  - **Accepted Document Types**: List of document types that satisfy this requirement
    - If multiple types are accepted, a yellow instruction row indicates "Choose ONE of the following document types:"
    - Each accepted document type shows its name
    - If the document type has specific fields, they are listed under "Field Name" column
    - If no specific fields are required, it shows "(No specific fields required)"

**Example document requirements:**
- Business License
- Proof of Address
- Identity Verification
- etc.

### Template Features

- **Frozen Panes**: The first 3 header rows are frozen, so they remain visible when scrolling
- **Column Widths**: Automatically set for optimal readability:
  - Column A (Field Name): 35 characters
  - Column B (Description): 50 characters
  - Column C (Value): 30 characters
- **Text Wrapping**: Descriptions wrap to multiple lines for readability
- **Alternating Row Colors**: Fields alternate between white and light gray for easier reading
- **Borders**: All cells have borders for clear structure

## Filling Out Compliance Checklists

### Step-by-Step Process

1. **Review the Regulation**: Read through the regulation name, country, and number type to ensure it matches your use case

2. **Collect Required Information**:
   - Go through each field in the "Required Information" section
   - Enter the corresponding value in Column C
   - Refer to the description in Column B if you're unsure what's needed

3. **Gather Required Documents**:
   - For each document requirement, identify which accepted document type you'll provide
   - If multiple types are accepted, choose the one that's easiest to obtain
   - Collect the actual documents (PDFs, images, etc.) separately
   - If the document type has specific fields, ensure you have all the information listed

4. **Verify Completeness**:
   - Check that all "Value" columns in the Required Information section are filled
   - Verify that you have all required documents ready
   - Cross-reference with the regulation's URL (if provided) for any additional requirements

### Best Practices

- **Save a Copy**: Before filling out, save a copy of the template to preserve the original structure
- **Use Clear Values**: Enter values clearly and consistently (e.g., use consistent date formats)
- **Document References**: Keep track of which physical documents correspond to each requirement
- **Review Before Submission**: Double-check all fields are complete before submitting to Twilio
- **Version Control**: If regulations change, export a new template rather than modifying old ones

## File Naming Conventions

Exported files follow these naming conventions:

- **Single Regulation**: `{regulation_friendly_name}_{first_8_chars_of_sid}.xlsx`
  - Example: `US_Local_Business_RN1234567.xlsx`
- **Multiple Regulations**: `regulations_export_{count}_regulations.xlsx`
  - Example: `regulations_export_3_regulations.xlsx`

Sheet names within the Excel file are derived from the regulation's friendly name, truncated to 31 characters (Excel's limit) and sanitized to remove invalid characters.

## Use Cases

### Compliance Preparation

Export regulations for countries where you plan to purchase phone numbers, then use the templates to:
- Identify all required information upfront
- Prepare documents in advance
- Create a checklist for your compliance team
- Track completion status

### Multi-Country Operations

Export regulations for multiple countries to:
- Compare requirements across jurisdictions
- Identify common requirements
- Plan resource allocation for compliance
- Maintain a centralized compliance database

### Documentation and Auditing

Use exported templates to:
- Document what information was collected
- Maintain records for audits
- Share requirements with stakeholders
- Create training materials for compliance teams

## Troubleshooting

### Export Fails

- **Check Regulation SID**: Ensure the regulation SID is valid and exists in the database
- **Verify Sync**: Regulations must be synced first using `POST /api/v1/sync/regulations`
- **Check API Logs**: Review API logs for detailed error messages

### Excel File Won't Open

- **File Format**: Ensure you're using a modern Excel version (2010+) or compatible software
- **File Size**: Very large exports (many regulations) may take time to generate
- **Corruption**: If the file appears corrupted, try exporting again

### Missing Information

- **Incomplete Sync**: If fields are missing, the regulation data may be incomplete. Re-sync regulations
- **Regulation Structure**: Some regulations may not have all sections (e.g., no required documents)

## Related Documentation

- [Regulatory Compliance Guide](./REGULATORY_COMPLIANCE_GUIDE.md) - Understanding regulations and compliance workflows
- [Sync Workflow](./SYNC_WORKFLOW.md) - How to sync regulations data
- [API Usage Guide](./API_USAGE_GUIDE.md) - API endpoint details and examples
