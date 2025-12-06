# Production Deployment Checklist

## 🎯 Pre-Deployment Security Checklist

Use this checklist before deploying the GCS DJI Dock dashboard to production.

### ✅ Authentication & Security

- [ ] **Generate Production SECRET_KEY**
  ```bash
  openssl rand -hex 32
  ```
  Update in `backend/.env`

- [ ] **Set Strong Password**
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, special characters
  - Update `GCS_PASSWORD` in `backend/.env`

- [ ] **Review User Credentials**
  - Change default username if needed
  - Update `GCS_USERNAME`, `GCS_FULLNAME`, `GCS_EMAIL`

- [ ] **Enable HTTPS**
  - Obtain SSL/TLS certificate
  - Configure reverse proxy (nginx/caddy)
  - Update frontend `VITE_BACKEND_URL` to use `https://`

- [ ] **Configure CORS Properly**
  In `backend/app/main.py`, change:
  ```python
  allow_origins=["*"]  # ⚠️ CHANGE THIS
  ```
  To:
  ```python
  allow_origins=["https://your-domain.com"]
  ```

- [ ] **Set Token Expiration**
  - Review `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60)
  - Adjust based on security requirements
  - Shorter = more secure, longer = better UX

### ✅ Environment Configuration

- [ ] **Remove Development Settings**
  - No hardcoded credentials in code
  - No debug flags enabled
  - Remove console.log statements

- [ ] **Environment Variables**
  - [ ] `SECRET_KEY` - Production secret (not default)
  - [ ] `GCS_USERNAME` - Production username
  - [ ] `GCS_PASSWORD` - Strong password
  - [ ] `THINGSBOARD_URL` - Production ThingsBoard
  - [ ] `DJI_API_BASE` - Production DJI API
  - [ ] `DJI_APP_KEY` - Production app key
  - [ ] `DJI_APP_LICENSE` - Production license

- [ ] **Backend .env Security**
  - File not committed to git
  - Proper file permissions (600)
  - Stored in secure location

- [ ] **Frontend Environment**
  - Create `.env.production`
  - Set `VITE_BACKEND_URL=https://your-api-domain.com`

### ✅ Database Migration (Recommended)

- [ ] **Setup Database**
  - Choose database (PostgreSQL, MongoDB, MySQL)
  - Install database client library
  - Create users table schema

- [ ] **Migrate User Data**
  - Move from `USERS_DB` dict to database
  - Implement user CRUD endpoints
  - Add user registration if needed

- [ ] **Password Policy**
  - Implement password strength validation
  - Add password reset functionality
  - Consider password expiration

### ✅ Monitoring & Logging

- [ ] **Setup Logging**
  - Configure structured logging
  - Log authentication events
  - Log failed login attempts
  - Log API errors

- [ ] **Monitoring**
  - Setup application monitoring
  - Monitor authentication failures
  - Alert on suspicious activity
  - Track session metrics

- [ ] **Audit Trail**
  - Log who accessed what and when
  - Store login history
  - Track mission commands
  - Implement log rotation

### ✅ Performance & Reliability

- [ ] **Backend Deployment**
  - Use production ASGI server (gunicorn + uvicorn)
  - Configure worker processes
  - Setup process manager (systemd, supervisor)
  - Configure auto-restart on failure

- [ ] **Frontend Deployment**
  - Build production bundle: `npm run build`
  - Configure CDN for static assets
  - Enable compression (gzip/brotli)
  - Setup caching headers

- [ ] **Reverse Proxy**
  - Configure nginx/caddy
  - Setup SSL termination
  - Enable rate limiting
  - Configure timeouts

### ✅ Security Hardening

- [ ] **Rate Limiting**
  - Add rate limiting to `/login` endpoint
  - Limit API requests per user/IP
  - Prevent brute force attacks

- [ ] **Input Validation**
  - Validate all user inputs
  - Sanitize before database operations
  - Prevent injection attacks

- [ ] **Headers Security**
  - Add security headers (HSTS, CSP, X-Frame-Options)
  - Configure CORS properly
  - Disable unnecessary headers

- [ ] **Dependency Scanning**
  - Run `npm audit` on frontend
  - Run `pip check` on backend
  - Update vulnerable packages

### ✅ Backup & Recovery

- [ ] **Database Backups**
  - Setup automated backups
  - Test restore procedure
  - Store backups securely

- [ ] **Configuration Backups**
  - Backup .env files securely
  - Document configuration
  - Version control (excluding secrets)

- [ ] **Disaster Recovery Plan**
  - Document recovery steps
  - Test recovery procedure
  - Define RPO/RTO

### ✅ Testing

- [ ] **Functional Testing**
  - Test login/logout flow
  - Test session timeout
  - Test all protected endpoints
  - Test error scenarios

- [ ] **Security Testing**
  - Test with invalid tokens
  - Test with expired tokens
  - Test CORS restrictions
  - Test rate limiting

- [ ] **Load Testing**
  - Test concurrent users
  - Test API performance
  - Identify bottlenecks

### ✅ Documentation

- [ ] **User Documentation**
  - Login instructions
  - Password change process
  - Troubleshooting guide

- [ ] **Admin Documentation**
  - Deployment process
  - Configuration guide
  - User management
  - Monitoring guide

- [ ] **API Documentation**
  - Update API docs with auth requirements
  - Document all endpoints
  - Provide examples

### ✅ Client Handoff

- [ ] **Credentials**
  - Provide admin credentials securely
  - Document where credentials are stored
  - Explain how to change passwords

- [ ] **Access**
  - Provide server access if needed
  - Document deployment process
  - Share monitoring dashboards

- [ ] **Support**
  - Provide contact for issues
  - Document escalation process
  - Set expectations for response times

## 🚀 Deployment Commands

### Backend Production Deployment

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run with Gunicorn** (recommended):
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

3. **Or with Uvicorn**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

### Frontend Production Build

```bash
cd frontend
npm run build
# Deploy 'dist' folder to web server or CDN
```

### Nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/gcs-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📋 Post-Deployment Verification

- [ ] Can login with credentials
- [ ] Session timeout works
- [ ] Logout works
- [ ] Protected endpoints require auth
- [ ] Invalid tokens rejected
- [ ] HTTPS working
- [ ] No console errors
- [ ] Monitoring active
- [ ] Logs being written
- [ ] Backups configured

## 🆘 Rollback Plan

In case of issues:

1. **Keep old version running** until new version verified
2. **Document rollback steps**:
   - Switch nginx to old backend
   - Restore old frontend
   - Restore database if needed
3. **Test rollback procedure** before deployment

## 📞 Emergency Contacts

Document these before deployment:

- **Technical Lead**: _______________
- **System Administrator**: _______________
- **Client Contact**: _______________
- **Emergency Hotline**: _______________

---

**Remember**: Security is an ongoing process. Regularly review and update these items.

**Date Completed**: _______________  
**Deployed By**: _______________  
**Client Sign-off**: _______________
