# Deployment Guide

This guide covers deploying the Twilio Number Search application to production environments. It includes configuration, security, scaling, and monitoring considerations.

## Overview

The application consists of three main components:
- **PostgreSQL Database**: Stores synced Twilio data
- **FastAPI Backend**: REST API service
- **React Frontend**: Admin UI

All components can be containerized using Docker and orchestrated with Docker Compose, or deployed separately to cloud platforms.

## Production Environment Setup

### Environment Variables

Create a production `.env` file with secure values:

```env
# Database Configuration
POSTGRES_USER=twilio_app
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=twilio_number_search
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://twilio_app:<password>@db:5432/twilio_number_search

# Twilio Credentials (Required)
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>

# API Configuration
API_PORT=8000
DEBUG=false

# Admin UI Configuration
ADMIN_PORT=8080
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Security Best Practices

1. **Use Strong Passwords**: Generate strong, random passwords for database and other services
2. **Never Commit Secrets**: Add `.env` to `.gitignore` and use secret management in production
3. **Use HTTPS**: Always use HTTPS in production (configure reverse proxy)
4. **Restrict Database Access**: Only allow connections from application containers
5. **Rotate Credentials**: Regularly rotate Twilio credentials and database passwords
6. **Environment-Specific Configs**: Use different credentials for dev/staging/production

### Required vs Optional Variables

**Required**:
- `TWILIO_ACCOUNT_SID`: Must be set for number search and sync operations
- `TWILIO_AUTH_TOKEN`: Must be set for number search and sync operations
- `DATABASE_URL`: Required for database connections
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Required for database setup

**Optional**:
- `API_PORT`: Defaults to 8000
- `ADMIN_PORT`: Defaults to 8080
- `DEBUG`: Defaults to false (should be false in production)
- `VITE_API_BASE_URL`: Required if frontend needs to connect to API

## Docker Configuration

### Production Docker Compose

Create a `docker-compose.prod.yml` for production:

```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    container_name: twilio-number-search-db-prod
    env_file:
      - .env.prod
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg-data-prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - twilio-network-prod
    restart: unless-stopped

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
    container_name: twilio-number-search-api-prod
    env_file:
      - .env.prod
    environment:
      DATABASE_URL: ${DATABASE_URL}
      DEBUG: "false"
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - twilio-network-prod
    restart: unless-stopped
    # Remove volume mounts for production

  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile.prod
    container_name: twilio-number-search-admin-prod
    env_file:
      - .env.prod
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    depends_on:
      - api
    networks:
      - twilio-network-prod
    restart: unless-stopped
    # Remove volume mounts for production

volumes:
  pg-data-prod:

networks:
  twilio-network-prod:
    driver: bridge
```

### Multi-Stage Dockerfiles

#### Backend Dockerfile (Production)

Create `api/Dockerfile.prod`:

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY app/ ./app/

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Run as non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile (Production)

Create `admin/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Static Asset Serving

For production, build the frontend and serve it with nginx:

1. **Build Frontend**: The Dockerfile builds the React app into static files
2. **Nginx Configuration**: Create `admin/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### CORS Configuration

Configure CORS in the FastAPI application for production:

```python
# api/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://admin.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Database Configuration

### Production PostgreSQL

1. **Use Managed Database**: Consider using managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
2. **Connection Pooling**: Configure connection pooling in the application
3. **Backups**: Set up automated backups
4. **Monitoring**: Enable query logging and performance monitoring

### Database Migrations

For production, use Alembic for migrations instead of auto-creation:

1. **Initialize Alembic**:
```bash
cd api
alembic init alembic
```

2. **Create Migration**:
```bash
alembic revision --autogenerate -m "Initial migration"
```

3. **Run Migrations**:
```bash
alembic upgrade head
```

4. **In Docker**: Add migration step to startup script

### Backup Strategy

1. **Automated Backups**: Schedule daily backups
2. **Retention Policy**: Keep backups for 30 days
3. **Test Restores**: Regularly test backup restoration
4. **Point-in-Time Recovery**: Consider enabling PITR for critical data

**Example Backup Script**:
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec twilio-number-search-db-prod pg_dump -U twilio_app twilio_number_search > "$BACKUP_DIR/backup_$DATE.sql"
```

## Scaling

### Horizontal Scaling

#### API Scaling

1. **Multiple API Instances**: Run multiple API containers behind a load balancer
2. **Stateless Design**: Ensure API is stateless (no in-memory state)
3. **Shared Database**: All instances connect to the same database
4. **Session Storage**: Use external session storage (Redis) if needed

**Docker Compose with Multiple API Instances**:
```yaml
api:
  # ... configuration ...
  deploy:
    replicas: 3
```

#### Database Scaling

1. **Read Replicas**: Use read replicas for read-heavy workloads
2. **Connection Pooling**: Use PgBouncer or similar for connection pooling
3. **Query Optimization**: Optimize slow queries
4. **Indexing**: Ensure proper indexes on frequently queried columns

### Vertical Scaling

1. **Resource Limits**: Set appropriate CPU/memory limits in Docker
2. **Database Resources**: Allocate sufficient resources to PostgreSQL
3. **Monitor Usage**: Track resource usage and adjust as needed

### Load Balancing

Use a reverse proxy (nginx, Traefik, etc.) to load balance API requests:

```nginx
upstream api_backend {
    least_conn;
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security

### Credential Management

1. **Secret Management**: Use secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
2. **Environment Variables**: Never hardcode credentials
3. **Rotation**: Regularly rotate credentials
4. **Access Control**: Limit who can access credentials

### Network Security

1. **Firewall Rules**: Restrict database access to application containers only
2. **VPN/Private Network**: Use private networks for internal communication
3. **HTTPS Only**: Enforce HTTPS for all external traffic
4. **Rate Limiting**: Implement rate limiting on API endpoints

### API Security

1. **Input Validation**: All inputs are validated via Pydantic schemas
2. **SQL Injection Prevention**: Use parameterized queries (SQLAlchemy handles this)
3. **Error Handling**: Don't expose sensitive information in error messages
4. **Logging**: Log security events without exposing sensitive data

### Database Security

1. **Encrypted Connections**: Use SSL/TLS for database connections
2. **Least Privilege**: Database user should have minimal required permissions
3. **Regular Updates**: Keep PostgreSQL updated
4. **Audit Logging**: Enable audit logging for sensitive operations

## Monitoring

### Health Checks

The application includes a health check endpoint:

```bash
GET /health
```

**Response**:
```json
{
  "status": "healthy"
}
```

### Logging

1. **Structured Logging**: Use structured logging (JSON format)
2. **Log Levels**: Set appropriate log levels (INFO for production)
3. **Log Aggregation**: Use log aggregation services (ELK, CloudWatch, etc.)
4. **Error Tracking**: Integrate error tracking (Sentry, Rollbar, etc.)

### Metrics

Monitor:
- API response times
- Database query performance
- Error rates
- Sync job success/failure rates
- Resource usage (CPU, memory, disk)

### Alerts

Set up alerts for:
- API downtime
- Database connection failures
- High error rates
- Sync job failures
- Resource exhaustion

## Deployment Process

### Initial Deployment

1. **Prepare Environment**: Set up production environment and credentials
2. **Build Images**: Build production Docker images
3. **Run Migrations**: Execute database migrations
4. **Start Services**: Start all services
5. **Verify Health**: Check health endpoints
6. **Initial Sync**: Run initial data syncs

### Updates

1. **Build New Images**: Build updated Docker images
2. **Run Migrations**: Execute any new migrations
3. **Rolling Update**: Update services one at a time (zero downtime)
4. **Verify**: Check health and functionality
5. **Rollback Plan**: Have a rollback plan ready

### Zero-Downtime Deployment

1. **Blue-Green Deployment**: Maintain two environments and switch between them
2. **Rolling Updates**: Update containers one at a time
3. **Health Checks**: Only route traffic to healthy instances
4. **Database Migrations**: Ensure migrations are backward compatible

## Cloud Platform Deployment

### AWS

- **ECS/EKS**: Deploy containers to ECS or EKS
- **RDS**: Use RDS for managed PostgreSQL
- **ALB**: Use Application Load Balancer for load balancing
- **CloudWatch**: Use CloudWatch for monitoring and logging

### Google Cloud

- **Cloud Run**: Deploy containers to Cloud Run
- **Cloud SQL**: Use Cloud SQL for managed PostgreSQL
- **Cloud Load Balancing**: Use for load balancing
- **Cloud Monitoring**: Use for monitoring

### Azure

- **Container Instances**: Deploy to Azure Container Instances
- **Azure Database**: Use Azure Database for PostgreSQL
- **Application Gateway**: Use for load balancing
- **Azure Monitor**: Use for monitoring

## Troubleshooting

### Services Won't Start

1. Check environment variables
2. Verify database connectivity
3. Check container logs: `docker-compose logs [service]`
4. Verify resource availability

### Performance Issues

1. Check database query performance
2. Monitor API response times
3. Review resource usage
4. Check for connection pool exhaustion

### Database Issues

1. Check database logs
2. Verify connection strings
3. Check disk space
4. Review slow query log

## Best Practices

1. **Start Small**: Begin with minimal resources and scale up as needed
2. **Monitor Early**: Set up monitoring from day one
3. **Automate**: Automate deployments and backups
4. **Test**: Test deployments in staging first
5. **Document**: Document your deployment process
6. **Backup**: Always have backups before major changes
7. **Security First**: Prioritize security in all decisions

## Related Documentation

- [Sync Workflow](./SYNC_WORKFLOW.md) - Production sync considerations
- [API Usage Guide](./API_USAGE_GUIDE.md) - API endpoint details
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure
