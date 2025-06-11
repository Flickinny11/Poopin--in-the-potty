# VidLiSync FastAPI Backend

Production-ready FastAPI backend for VidLiSync video chat application with AI translation.

## Features

- **Complete Database Schema**: 7 tables with proper relationships and constraints
- **Row Level Security**: All tables protected with RLS policies
- **Performance Optimized**: Comprehensive indexing for fast queries
- **JWT Authentication**: Supabase integration with middleware
- **Comprehensive API**: All CRUD operations for users, calls, settings, contacts
- **Production Ready**: Docker configuration, health checks, and monitoring
- **Migration System**: Alembic for database version control

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL database
- Supabase account

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key
   JWT_SECRET_KEY=your_jwt_secret
   ```

4. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start the server**
   ```bash
   ./start.sh
   ```

6. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Database Schema

### Tables

1. **users** - User profiles and authentication
2. **voice_profiles** - AI voice training data
3. **calls** - Video call sessions and history
4. **subscriptions** - User subscription management
5. **usage_logs** - Feature usage tracking
6. **contacts** - User contact management
7. **user_settings** - User preferences and configuration

### Performance Indexes

All tables include optimized indexes:
- User lookup by email and subscription tier
- Call history by user and date
- Usage tracking by user and feature
- Voice profiles by user and language
- Fast settings retrieval

## API Endpoints

### Authentication (`/auth/`)
- `POST /auth/verify` - Verify JWT token
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout user

### Users (`/users/`)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/me/voice-profiles` - Get voice profiles
- `POST /users/me/voice-profiles` - Create voice profile

### Calls (`/calls/`)
- `POST /calls/` - Create new call
- `GET /calls/` - Get user's calls
- `GET /calls/{id}` - Get call details
- `PUT /calls/{id}` - Update call
- `POST /calls/{id}/join` - Join call
- `POST /calls/{id}/end` - End call

### Settings (`/settings/`)
- `GET /settings/` - Get user settings
- `POST /settings/` - Create/update setting
- `PUT /settings/{key}` - Update specific setting
- `DELETE /settings/{key}` - Delete setting

### Contacts (`/contacts/`)
- `GET /contacts/` - Get user contacts
- `POST /contacts/` - Add contact
- `PUT /contacts/{id}` - Update contact
- `DELETE /contacts/{id}` - Delete contact

### Health (`/health/`)
- `GET /health/` - System health check
- `GET /health/detailed` - Detailed system status

## Security

### Row Level Security (RLS)

All tables implement RLS policies:
- Users can only access their own data
- Call participants can access call data
- Contacts are user-scoped
- Settings are user-private

### Authentication

- JWT token verification on all protected routes
- Supabase integration for user management
- Rate limiting to prevent abuse
- Input validation with Pydantic

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Docker Development

```bash
# Build image
docker build -t vidlisync-backend .

# Run container
docker run -p 8000:8000 --env-file .env vidlisync-backend
```

## Production Deployment

### Docker

```bash
# Build production image
docker build -t vidlisync-backend:latest .

# Run with environment variables
docker run -d \
  --name vidlisync-backend \
  --env-file .env \
  -p 8000:8000 \
  vidlisync-backend:latest
```

### Railway Deployment

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

Required environment variables:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS`

## Performance Benchmarks

Target performance metrics:
- User lookup: < 50ms
- Call history fetch: < 100ms
- Settings update: < 75ms
- Complex queries: < 200ms

## Monitoring

### Health Checks

- Database connectivity
- System status
- API responsiveness

### Logging

Structured logging for:
- Request/response cycles
- Database operations
- Authentication events
- Error tracking

## Architecture

```
├── app/
│   ├── main.py              # FastAPI application
│   ├── database/            # Database connection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── middleware/          # Authentication middleware
│   └── routers/             # API endpoints
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── Dockerfile              # Production container
└── start.sh                # Startup script
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.