# MindCare AI - Multi-Service Deployment Guide

## Architecture Overview

MindCare AI uses **3 microservices**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Netlify)                        │
│              apps/frontend (Static HTML/CSS/JS)              │
└──────┬──────────────────────┬──────────────────┬─────────────┘
       │                      │                  │
       ▼                      ▼                  ▼
   Backend Service      Jarvis-Mate Service   NutriMate Service
   (Auth/Newsletter)    (AI Chat)              (Diet Plans)
   Port: 5002          Port: 5003             Port: 5004
```

---

## Configuration File

**File**: `apps/frontend/assets/js/config.js`

This single file manages all 3 service URLs. Update it based on your environment:

### Development (Local) - Default

```javascript
DEVELOPMENT: {
  BACKEND: 'http://localhost:5002',        // Auth, Newsletter
  JARVIS_MATE: 'http://localhost:5003',    // Chat AI
  NUTRIMATE: 'http://localhost:5004'       // Nutrition AI
}
```

### Production - Update These

```javascript
PRODUCTION: {
  BACKEND: 'https://backend-api.mindcare.com',      // ← Update
  JARVIS_MATE: 'https://jarvis-api.mindcare.com',   // ← Update
  NUTRIMATE: 'https://nutrimate-api.mindcare.com'   // ← Update
}
```

---

## Deployment Steps

### Step 1: Deploy All 3 Backend Services

#### **Backend Service** (Node.js)
```bash
# Services location: services/backend/

# Deploy to Railway.app, Heroku, or your server
# Get the URL (e.g., https://mindcare-backend.railway.app)
# PORT: 5002
```

#### **Jarvis-Mate Service** (Python)
```bash
# Services location: services/jarvis-mate/

# Deploy to Railway.app or similar
# Get the URL (e.g., https://mindcare-jarvis.railway.app)
# PORT: 5003
```

#### **NutriMate Service** (Python)
```bash
# Services location: services/nutrimate/

# Deploy to Railway.app or similar
# Get the URL (e.g., https://mindcare-nutrimate.railway.app)
# PORT: 5004
```

### Step 2: Update config.js with Production URLs

Edit `apps/frontend/assets/js/config.js`:

```javascript
PRODUCTION: {
  BACKEND: 'https://mindcare-backend.railway.app',
  JARVIS_MATE: 'https://mindcare-jarvis.railway.app',
  NUTRIMATE: 'https://mindcare-nutrimate.railway.app'
}
```

### Step 3: Push Frontend to Netlify

```bash
git add apps/frontend/assets/js/config.js
git commit -m "Update production service URLs"
git push origin main
# Netlify auto-deploys!
```

---

## API Endpoints by Service

### Backend Service

- `POST /api/auth/register` - User signup
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Session verification
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/forgot-password/request` - Request password reset
- `POST /api/auth/forgot-password/verify` - Verify OTP
- `POST /api/auth/forgot-password/reset` - Reset password
- `POST /api/newsletter/subscribe` - Newsletter signup

### Jarvis-Mate Service

- `POST /api/chat` - Send chat message to AI
  - **Request**: `{ message: string, userId: string }`
  - **Response**: `{ response: string }`

### NutriMate Service

- `POST /api/diet` - Generate diet plan
  - **Request**:
    ```json
    {
      "age": number,
      "weight": number,
      "height": number,
      "activity_level": string,
      "health_condition": string,
      "dietary_preference": string,
      "diet_type": string
    }
    ```
  - **Response**:
    ```json
    {
      "bmi": number,
      "type": string,
      "diet_plan": string
    }
    ```

---

## Deployment Checklist

### Backend Service Deployment
- [ ] Code deployed to Railway/Heroku
- [ ] Environment variables configured (.env)
- [ ] MongoDB URI configured
- [ ] CORS enabled for frontend domain
- [ ] Health check: `GET /` returns homepage
- [ ] Auth endpoints working
- [ ] Newsletter endpoints working
- [ ] Copy the service URL (e.g., `https://mindcare-backend.railway.app`)

### Jarvis-Mate Service Deployment
- [ ] Code deployed to Railway/Heroku
- [ ] All dependencies installed
- [ ] Service starts on correct port
- [ ] `POST /api/chat` endpoint responds
- [ ] Copy the service URL (e.g., `https://mindcare-jarvis.railway.app`)

### NutriMate Service Deployment
- [ ] Code deployed to Railway/Heroku
- [ ] All dependencies installed
- [ ] Service starts on correct port
- [ ] `POST /api/diet` endpoint responds
- [ ] Copy the service URL (e.g., `https://mindcare-nutrimate.railway.app`)

### Frontend Deployment
- [ ] Update 3 URLs in `config.js`
- [ ] Test each API from frontend:
  - [ ] Login/Signup works (Backend)
  - [ ] Newsletter subscription (Backend)
  - [ ] Chat with Jarvis (Jarvis-Mate)
  - [ ] Diet plan generation (NutriMate)
- [ ] All features functional
- [ ] No console errors

---

## Environment Variable Example (.env)

### Backend (.env)
```
PORT=5002
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindcare
JWT_SECRET=your-secret-key
```

### Jarvis-Mate (.env)
```
PORT=5003
FLASK_ENV=production
API_KEY=your-ai-api-key
```

### NutriMate (.env)
```
PORT=5004
FLASK_ENV=production
```

---

## Troubleshooting

### Frontend Shows "Network Error"
- Check if all 3 service URLs are correct in `config.js`
- Verify each service is deployed and running
- Check browser console for CORS errors

### Chat Not Working (Jarvis)
- Verify `CONFIG.getJarvisUrl()` points to correct service
- Test: `curl -X POST https://jarvis-url/api/chat -d '{"message":"hi"}'`
- Check service logs for errors

### Diet Plan Not Working (NutriMate)
- Verify `CONFIG.getNutrimateUrl()` points to correct service
- Test: `curl -X POST https://nutrimate-url/api/diet -d '{...}'`
- Ensure all required fields are sent

### CORS Error
- Add frontend URL to CORS whitelist in backend:
  ```javascript
  cors({
    origin: 'https://your-domain.netlify.app',
    credentials: true
  })
  ```

---

## Quick Reference: Service Helper Functions

In any JavaScript file, you can use:

```javascript
CONFIG.getBackendUrl()      // Gets Backend URL
CONFIG.getJarvisUrl()       // Gets Jarvis-Mate URL
CONFIG.getNutrimateUrl()    // Gets NutriMate URL
CONFIG.getEnvironment()     // Returns 'DEVELOPMENT' or 'PRODUCTION'
```

Example usage:
```javascript
const chatUrl = `${CONFIG.getJarvisUrl()}/api/chat`;
const dietUrl = `${CONFIG.getNutrimateUrl()}/api/diet`;
const authUrl = `${CONFIG.getBackendUrl()}/api/auth/login`;
```

---

## Local Development

Running all services locally:

```bash
# Terminal 1 - Backend
cd services/backend
npm install
npm start  # Runs on http://localhost:5002

# Terminal 2 - Jarvis-Mate
cd services/jarvis-mate
pip install -r requirements.txt
python jarvis_server.py  # Runs on http://localhost:5003

# Terminal 3 - NutriMate
cd services/nutrimate
pip install -r requirements.txt
python nutrimate_server.py  # Runs on http://localhost:5004

# Terminal 4 - Frontend
cd apps/frontend
# Open Him2.html in browser or use Live Server
```

Frontend will auto-detect local ports and use DEVELOPMENT config.

---

## Summary

| Service | Type | Port (Local) | Endpoints |
|---------|------|--------|-----------|
| **Backend** | Node.js | 5002 | `/api/auth/*`, `/api/newsletter/*` |
| **Jarvis-Mate** | Python | 5003 | `/api/chat` |
| **NutriMate** | Python | 5004 | `/api/diet` |
| **Frontend** | Static | - | Deployed on Netlify |

Update `config.js` with production URLs and you're ready to go! 🚀
