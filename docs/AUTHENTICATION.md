# Authentication System Documentation

## Overview

The GCS DJI Dock dashboard implements a secure JWT-based authentication system with the following features:

- ✅ JWT token-based authentication
- ✅ Secure password hashing (bcrypt)
- ✅ Token storage in localStorage
- ✅ Automatic session timeout
- ✅ Protected API endpoints
- ✅ Logout functionality

## Architecture

### Backend (FastAPI)

The backend uses:
- **FastAPI** for the REST API
- **python-jose** for JWT token generation and verification
- **passlib** with bcrypt for password hashing
- **HTTPBearer** security scheme

### Frontend (React)

The frontend implements:
- Login screen with username/password
- JWT token storage in localStorage
- Automatic token verification on app load
- Session timeout monitoring
- Logout functionality with token cleanup

## Configuration

### Environment Variables

Add these variables to `/backend/.env`:

```env
# JWT Authentication
SECRET_KEY=gcs-dji-dock-super-secret-key-change-this-in-production-2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# User Credentials
GCS_USERNAME=fieldrobotics
GCS_PASSWORD=FieldRobotics2025!GCS
GCS_FULLNAME=Field Robotics Admin
GCS_EMAIL=admin@fieldrobotics.it
```

**⚠️ IMPORTANT FOR PRODUCTION:**
1. Generate a secure SECRET_KEY: `openssl rand -hex 32`
2. Use a strong password for GCS_PASSWORD
3. Store credentials securely (database, vault, etc.)
4. Enable HTTPS for production deployment

## Default Credentials

For development/testing:
- **Username:** `fieldrobotics`
- **Password:** `FieldRobotics2025!GCS`

## API Endpoints

### Authentication Endpoints

#### `POST /login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "fieldrobotics",
  "password": "FieldRobotics2025!GCS"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### `POST /logout`
Logout user (requires valid token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "ok",
  "message": "Logged out successfully"
}
```

#### `GET /verify-token`
Verify if the current token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "ok",
  "username": "fieldrobotics",
  "full_name": "Field Robotics Admin",
  "email": "admin@fieldrobotics.it"
}
```

### Protected Endpoints

All the following endpoints require a valid JWT token in the Authorization header:

- `GET /telemetry` - Get drone and hangar telemetry
- `POST /mission` - Send mission to drone
- `GET /missions` - Get saved missions
- `GET /dji/token` - Get DJI Cloud API token

## Frontend Implementation

### Login Flow

1. User enters credentials in `LoginScreen` component
2. Frontend sends POST request to `/login`
3. On success:
   - JWT token stored in `localStorage.gcs_token`
   - Token expiration stored in `localStorage.gcs_token_expires`
   - Username stored in `localStorage.gcs_username`
   - Axios default headers set with `Authorization: Bearer <token>`
4. User redirected to main dashboard

### Token Verification

On app load (`App.jsx` useEffect):
1. Check if token exists in localStorage
2. Check if token is expired (client-side)
3. Call `/verify-token` to validate with backend
4. If valid: authenticate user
5. If invalid/expired: clear storage and show login screen

### Session Timeout

- Token expires after 60 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Frontend checks token expiration every minute
- If expired: automatic logout and redirect to login screen
- If backend returns 401: automatic logout

### Logout Flow

1. User clicks logout button in sidebar
2. Frontend calls POST `/logout`
3. Clear localStorage:
   - `gcs_token`
   - `gcs_token_expires`
   - `gcs_username`
4. Remove Authorization header from axios
5. Redirect to login screen

## Security Best Practices

### Current Implementation

✅ Passwords hashed with bcrypt  
✅ JWT tokens with expiration  
✅ Protected endpoints with middleware  
✅ Token verification on each request  
✅ Client-side token expiration check  
✅ CORS configured  

### Production Recommendations

1. **HTTPS Only**: Deploy with SSL/TLS certificates
2. **Secure SECRET_KEY**: Use cryptographically secure random key
3. **Database Storage**: Store users in database, not hardcoded
4. **Rate Limiting**: Add rate limiting to login endpoint
5. **Refresh Tokens**: Implement refresh token mechanism
6. **Password Policy**: Enforce strong password requirements
7. **Multi-Factor Auth**: Consider 2FA for critical operations
8. **Audit Logging**: Log authentication events
9. **Session Management**: Track active sessions
10. **Token Blacklisting**: Implement token revocation on logout

## Adding New Users

Currently, users are defined in `backend/app/main.py` in the `USERS_DB` dictionary:

```python
USERS_DB = {
    "username": {
        "username": "username",
        "hashed_password": pwd_context.hash("password"),
        "full_name": "Full Name",
        "email": "email@example.com",
    }
}
```

**For Production**: Migrate to a database (PostgreSQL, MongoDB, etc.) with proper user management endpoints.

## Troubleshooting

### "Cannot connect to server"
- Ensure backend is running: `uvicorn app.main:app --reload`
- Check `VITE_BACKEND_URL` in frontend `.env`

### "Invalid username or password"
- Verify credentials in backend `.env`
- Check that password is correctly hashed

### "Token verification failed"
- Token may be expired - check `ACCESS_TOKEN_EXPIRE_MINUTES`
- SECRET_KEY mismatch between backend instances
- Clear localStorage and login again

### "401 Unauthorized" on API calls
- Token missing or expired
- Token not included in Authorization header
- Backend authentication middleware failing

## Testing

### Manual Testing

1. Start backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Test login with credentials:
   - Username: `fieldrobotics`
   - Password: `FieldRobotics2025!GCS`

4. Verify protected endpoints work
5. Test logout functionality
6. Test session timeout (change `ACCESS_TOKEN_EXPIRE_MINUTES` to 1 for quick testing)

### API Testing with curl

```bash
# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fieldrobotics","password":"FieldRobotics2025!GCS"}'

# Verify token (replace <TOKEN> with actual token)
curl http://localhost:8000/verify-token \
  -H "Authorization: Bearer <TOKEN>"

# Access protected endpoint
curl http://localhost:8000/telemetry \
  -H "Authorization: Bearer <TOKEN>"

# Logout
curl -X POST http://localhost:8000/logout \
  -H "Authorization: Bearer <TOKEN>"
```

## Migration Guide (Development to Production)

1. **Generate Production Secret**:
   ```bash
   openssl rand -hex 32
   ```
   Add to `.env` as `SECRET_KEY`

2. **Setup Database**:
   - Create users table
   - Migrate user credentials from hardcoded dict
   - Implement user CRUD endpoints

3. **Enable HTTPS**:
   - Obtain SSL certificate
   - Configure reverse proxy (nginx, caddy)
   - Update CORS settings

4. **Environment Variables**:
   - Move all secrets to secure vault
   - Use environment-specific configs

5. **Monitoring**:
   - Setup logging for auth events
   - Monitor failed login attempts
   - Alert on suspicious activity

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Role-based access control (RBAC)
- [ ] Multi-factor authentication
- [ ] Password reset functionality
- [ ] Account lockout after failed attempts
- [ ] Session management dashboard
- [ ] OAuth2 integration
- [ ] API key authentication for programmatic access
