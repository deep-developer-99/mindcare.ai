# MindCare AI - Deployment Configuration Guide

## API Endpoint Configuration

All API calls now use a centralized configuration system. This makes deployment seamless across environments.

### How It Works

**File**: `apps/frontend/assets/js/config.js`

The config automatically detects the environment:

- **Development** (running locally): Uses `http://localhost:5002`
- **Production** (deployed): Uses your production API endpoint

### Setting Your Production API

When you're ready to deploy, update the production endpoint in `config.js`:

```javascript
PRODUCTION: {
  API_BASE: "https://your-api-domain.com"; // ← UPDATE THIS
}
```

#### Examples:

**If your API is on Railway.app:**

```javascript
API_BASE: "https://mindcare-api-prod.up.railway.app";
```

**If your API is on Heroku:**

```javascript
API_BASE: "https://mindcare-api-prod.herokuapp.com";
```

**If your API is on your own domain:**

```javascript
API_BASE: "https://api.mindcare.com";
```

### Endpoints Being Used

Your frontend calls these API endpoints (ensure your backend has them):

- **Authentication**
  - `POST /api/auth/register` - Sign up
  - `POST /api/auth/login` - Login
  - `POST /api/auth/logout` - Logout
  - `GET /api/auth/verify` - Session verification
  - `POST /api/auth/forgot-password/request` - Forgot password
  - `POST /api/auth/forgot-password/verify` - Verify OTP
  - `POST /api/auth/forgot-password/reset` - Reset password

- **Newsletter**
  - `POST /api/newsletter/subscribe` - Newsletter subscription

- **Assistants**
  - `POST /api/assistant/open/:assistantKey` - Launch assistant

### Deployment Checklist

- [ ] Backend API is deployed and accessible
- [ ] Test all API endpoints respond correctly
- [ ] Update `API_BASE` in `config.js` with production URL
- [ ] Push changes to GitHub
- [ ] Deploy to Netlify (auto-deploys from git)
- [ ] Test in production environment
  - [ ] Login/signup works
  - [ ] Newsletter subscription works
  - [ ] AI assistants (Jarvis, NutriMate) respond
  - [ ] Logout clears session

### Environment Variables (Optional Advanced)

If you want even more control, you can use environment variables with Netlify:

1. Go to Netlify Dashboard → Site Settings → Build & Deploy → Environment
2. Add variable: `REACT_APP_API_BASE=https://your-api-domain.com`
3. Update `config.js` to use it:

```javascript
getApiBase: function() {
  if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
    return this.DEVELOPMENT.API_BASE;
  }
  // Use environment variable if available
  return window.__ENV__?.API_BASE || this.PRODUCTION.API_BASE;
}
```

### Troubleshooting

**Error: "Server is not reachable"**

- Check that API_BASE is correct in config.js
- Verify backend server is running
- Check CORS settings on backend

**Error: "Network error"**

- Check API endpoint is accessible from the internet
- Test with curl: `curl https://your-api-domain.com/api/auth/verify`

**API calls work locally but fail in production**

- Backend might have CORS restrictions
- Ensure backend accepts requests from your Netlify domain
- Add to backend CORS: `https://your-domain.netlify.app`

---

**Need help?** Check that all files reference `CONFIG.getApiBase()` instead of hardcoded URLs.
