# Quick Setup Guide - Authentication

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
# Dependencies are already in requirements.txt
# They will be installed in your virtual environment
```

### 2. Configure Environment Variables

The `.env` file has been updated with authentication settings:

```env
# JWT Authentication (already configured)
SECRET_KEY=gcs-dji-dock-super-secret-key-change-this-in-production-2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Default User Credentials
GCS_USERNAME=fieldrobotics
GCS_PASSWORD=FieldRobotics2025!GCS
GCS_FULLNAME=Field Robotics Admin
GCS_EMAIL=admin@fieldrobotics.it
```

### 3. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload
```

Backend will be available at: `http://localhost:8000`

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 5. Login

Use these credentials to login:
- **Username**: `fieldrobotics`
- **Password**: `FieldRobotics2025!GCS`

## ✅ What's Implemented

### Backend Features
- ✅ JWT token generation and validation
- ✅ Password hashing with bcrypt
- ✅ Protected API endpoints
- ✅ `/login` endpoint for authentication
- ✅ `/logout` endpoint for session termination
- ✅ `/verify-token` endpoint for token validation
- ✅ All existing endpoints now protected with JWT

### Frontend Features
- ✅ Professional login screen
- ✅ Token storage in localStorage
- ✅ Automatic token verification on app load
- ✅ Session timeout monitoring (60 minutes)
- ✅ Logout button in sidebar
- ✅ Automatic logout on token expiration
- ✅ Error handling for network issues
- ✅ Loading states during authentication

## 🔐 Security Features

1. **Password Hashing**: All passwords hashed with bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Tokens expire after 60 minutes
4. **Protected Endpoints**: All data endpoints require valid token
5. **Automatic Cleanup**: Token removed on logout or expiration
6. **Error Handling**: Graceful handling of authentication failures

## 🎨 User Experience

- Clean, modern login interface
- Real-time validation
- Clear error messages
- Loading indicators
- Session persistence across page refreshes
- Automatic redirect on authentication state changes

## 📝 Customization

### Change Token Expiration Time

Edit `backend/.env`:
```env
ACCESS_TOKEN_EXPIRE_MINUTES=120  # 2 hours
```

### Change User Credentials

Edit `backend/.env`:
```env
GCS_USERNAME=your_username
GCS_PASSWORD=your_password
GCS_FULLNAME=Your Full Name
GCS_EMAIL=your@email.com
```

Then restart the backend.

### Add Multiple Users

Edit `backend/app/main.py` and modify the `USERS_DB` dictionary:

```python
USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin_password"),
        "full_name": "Administrator",
        "email": "admin@company.com",
    },
    "operator": {
        "username": "operator",
        "hashed_password": pwd_context.hash("operator_password"),
        "full_name": "Operator User",
        "email": "operator@company.com",
    },
}
```

## 🧪 Testing

### Test Login Endpoint

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fieldrobotics","password":"FieldRobotics2025!GCS"}'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Test Protected Endpoint

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fieldrobotics","password":"FieldRobotics2025!GCS"}' | jq -r '.access_token')

# Use token to access protected endpoint
curl http://localhost:8000/telemetry \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

### Cannot Login

1. Check backend is running: `http://localhost:8000`
2. Verify credentials in `backend/.env`
3. Check browser console for errors
4. Verify backend logs for authentication errors

### "Cannot connect to server"

1. Ensure backend is running
2. Check `VITE_BACKEND_URL` in frontend (should be `http://localhost:8000`)
3. Verify no firewall blocking port 8000

### Token Expired Immediately

1. Check system time is correct
2. Verify `ACCESS_TOKEN_EXPIRE_MINUTES` is set properly
3. Clear browser localStorage and login again

### 401 Errors on API Calls

1. Clear localStorage: `localStorage.clear()`
2. Login again to get fresh token
3. Check token is being sent in Authorization header
4. Verify backend SECRET_KEY matches

## 📚 Documentation

For detailed documentation, see:
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Complete authentication documentation
- Backend API: `http://localhost:8000/docs` (FastAPI Swagger UI)

## 🚀 Production Deployment

Before deploying to production:

1. **Generate secure SECRET_KEY**:
   ```bash
   openssl rand -hex 32
   ```

2. **Use strong passwords** (min 12 characters, special chars, etc.)

3. **Enable HTTPS** - Never use JWT over plain HTTP in production

4. **Configure CORS** properly - Don't use `allow_origins=["*"]` in production

5. **Use environment variables** - Don't commit secrets to git

6. **Setup database** - Move from hardcoded users to database

7. **Add rate limiting** - Prevent brute force attacks

See [AUTHENTICATION.md](./AUTHENTICATION.md) for production best practices.
