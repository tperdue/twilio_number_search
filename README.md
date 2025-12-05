# Twilio Number Search

A full-stack application for searching available Twilio phone numbers and managing regulatory compliance information. The application provides a simplified interface for querying Twilio's number inventory and understanding country-specific regulatory requirements.

## Features

- **Number Search**: Search for available phone numbers by country, number type, and capabilities (SMS/Voice)
- **Regulatory Compliance**: Query country-specific regulations and requirements for phone number registration
- **Country Management**: Browse available countries and their supported number types
- **Data Synchronization**: Sync Twilio number types, countries, and regulations to a local database
- **Admin UI**: Modern React-based admin interface for managing searches and viewing data

## Architecture

The application consists of three main components:

- **Backend API** (`api/`): FastAPI application providing REST endpoints for number search and regulatory data
- **Admin Frontend** (`admin/`): React + TypeScript admin interface built with Vite
- **Database**: PostgreSQL database for storing synced Twilio data (countries, regulations, number types)

### Tech Stack

- **Backend**: FastAPI (Python 3.11), SQLAlchemy (async), AsyncPG
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)
- A [Twilio account](https://www.twilio.com/try-twilio) with:
  - Account SID
  - Auth Token

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd twilio-number-search
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=twilio_number_search
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/twilio_number_search

# Twilio Credentials (Required)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# API Configuration
API_PORT=8000
DEBUG=false

# Admin UI Configuration
ADMIN_PORT=8080
VITE_API_BASE_URL=http://localhost:8000
```

**Important**: Replace `your_account_sid_here` and `your_auth_token_here` with your actual Twilio credentials. You can find these in your [Twilio Console](https://console.twilio.com/).

### 3. Start the Application

Start all services using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- FastAPI backend (port 8000)
- React admin frontend (port 8080)

To view logs:

```bash
docker-compose logs -f
```

To stop all services:

```bash
docker-compose down
```

## Running the Application

### Development Mode

The Docker Compose setup is configured for development with hot-reload enabled:

- **Backend**: Code changes in `api/app/` are automatically reloaded
- **Frontend**: Code changes in `admin/src/` trigger Vite's hot module replacement

### Service URLs

Once the services are running:

- **API**: http://localhost:8000
- **Admin UI**: http://localhost:8080
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **API ReDoc**: http://localhost:8000/redoc

### Health Check

Verify the API is running:

```bash
curl http://localhost:8000/health
```

Expected response: `{"status": "healthy"}`

## API Documentation

The FastAPI application provides interactive API documentation:

- **Swagger UI**: Visit http://localhost:8000/docs for an interactive API explorer
- **ReDoc**: Visit http://localhost:8000/redoc for alternative documentation format

### Main API Endpoints

- `POST /api/v1/numbers/search` - Search for available phone numbers
- `GET /api/v1/countries` - List countries and number types
- `GET /api/v1/regulations/{country_code}` - Get regulations for a country
- `POST /api/v1/sync` - Trigger data synchronization from Twilio

## Documentation

Comprehensive documentation is available in the `docs/` folder:

### User Guides

- **[Excel Export Guide](docs/EXCEL_EXPORT_GUIDE.md)** - Learn how to export regulations as Excel templates for compliance checklists
- **[Regulatory Compliance Guide](docs/REGULATORY_COMPLIANCE_GUIDE.md)** - Understand regulations, query them, and use them for compliance workflows
- **[Sync Workflow](docs/SYNC_WORKFLOW.md)** - Guide to data synchronization operations, monitoring sync jobs, and troubleshooting

### Developer Guides

- **[API Usage Guide](docs/API_USAGE_GUIDE.md)** - Practical API examples, common use cases, error handling, and integration patterns
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment, security, scaling, monitoring, and cloud platform considerations

### Reference

- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Complete database structure, table schemas, relationships, JSON structures, and example queries

## Project Structure

```
twilio-number-search/
├── api/                    # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic (Twilio client)
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── config.py       # Application configuration
│   │   └── main.py         # FastAPI app entry point
│   ├── Dockerfile
│   └── requirements.txt
├── admin/                  # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   └── types/          # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
└── README.md
```

## Development

### Backend Development

The API service mounts the `api/app/` directory as a volume, so changes to Python files are automatically reloaded. The service uses `uvicorn --reload` for hot-reload.

### Frontend Development

The admin service mounts the `admin/src/` directory and configuration files as volumes. Vite's dev server automatically reloads on file changes.

### Database Migrations

The application uses SQLAlchemy's metadata to create tables automatically on startup. For production, consider using Alembic for proper database migrations.

### Building for Production

To build production images:

```bash
docker-compose build
```

Note: The current Dockerfiles are configured for development. For production, you may want to:
- Use multi-stage builds for optimized images
- Build the frontend static assets and serve them with a web server
- Configure proper CORS origins
- Use environment-specific configurations

## Troubleshooting

### Services won't start

1. Check that ports 5432, 8000, and 8080 are not already in use
2. Verify your `.env` file exists and contains all required variables
3. Check Docker logs: `docker-compose logs [service-name]`

### API returns 500 errors

1. Verify Twilio credentials are set correctly in `.env`
2. Check API logs: `docker-compose logs api`
3. Ensure the database is healthy: `docker-compose ps`

### Frontend can't connect to API

1. Verify `VITE_API_BASE_URL` in `.env` matches your API URL
2. Check that the API service is running: `docker-compose ps api`
3. Check browser console for CORS errors

## License

This project is released into the public domain. You are free to use, modify, distribute, and use this software for any purpose, commercial or non-commercial, without any restrictions or obligations.

**Disclaimer**: This software is provided "as is", without warranty of any kind, express or implied. The authors and contributors are not responsible for any damages, losses, or issues arising from the use of this software.

## Contributing

This project is maintained on a best-effort basis. While I'll try to answer questions when possible, I cannot guarantee active support or timely responses.

**Forking Encouraged**: I highly encourage users to fork this project for their own specific use cases. Feel free to modify, extend, and adapt the code to meet your needs without waiting for upstream changes.

