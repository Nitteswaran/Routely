# Fixing Login and Register Issues

## ✅ What's Fixed

1. **Removed Clerk Dependencies** - The app now uses localStorage-based JWT authentication
2. **Backend is Running** - Server is accessible on port 5000
3. **Clerk Key Saved** - Your Clerk publishable key is in `frontend/.env.local` for future use

## 🔍 Current Status

- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend proxy configured to forward `/api` requests to backend
- ✅ Login/Register pages using localStorage-based auth
- ✅ Dashboard fixed to use localStorage instead of Clerk hooks

## 🚀 To Test Login/Register

1. **Make sure both servers are running:**
   ```powershell
   # Terminal 1 - Backend (should already be running)
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open your browser:**
   - Frontend: `http://localhost:5173` (Vite default) or `http://localhost:3000` (if configured)
   - Click "Sign Up" or "Login" in the navbar

3. **Try registering:**
   - Fill in name, email, password (min 6 chars)
   - Click "Create Account"
   - Should redirect to dashboard on success

## 🐛 If Login/Register Still Don't Work

### Check 1: Backend Connection
Open browser console (F12) and check:
- Any `ERR_CONNECTION_REFUSED` errors?
- Any CORS errors?
- Network tab shows API requests failing?

### Check 2: Backend Logs
Look at backend terminal for:
- `POST /api/auth/register` requests
- Any error messages
- MongoDB connection status

### Check 3: Frontend Port
Vite config shows port 3000, but default is 5173. Check which port your frontend is actually running on.

### Check 4: API Proxy
The proxy in `vite.config.js` should forward `/api/*` to `http://localhost:5000`. Verify this is working.

## 📝 Quick Debug Steps

1. **Test backend directly:**
   ```powershell
   # In PowerShell
   $body = @{
       name = "Test User"
       email = "test@example.com"
       password = "test123"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
   ```

2. **Check frontend API service:**
   - Open browser console
   - Look for `[API Service]` logs showing the API base URL
   - Should show: `/api` (relative path) or the full URL if `VITE_API_BASE_URL` is set

3. **Verify environment:**
   - Check `frontend/.env.local` exists with Clerk key (for future use)
   - No need for `VITE_API_BASE_URL` in dev - proxy handles it

## 🔄 Current Authentication System

**NOT using Clerk right now** - Using localStorage + JWT:

- Login/Register → Backend (`/api/auth/login`, `/api/auth/register`)
- Backend returns JWT token
- Token stored in `localStorage`
- Token sent in `Authorization: Bearer <token>` header for protected routes

## 💡 Future: Adding Clerk Back

If you want to use Clerk authentication later:

1. Clerk key is already in `.env.local`
2. Need to:
   - Re-enable ClerkProvider in `main.jsx`
   - Update components to use Clerk hooks
   - Sync Clerk users with MongoDB backend
   - Update backend to verify Clerk tokens

For now, the localStorage/JWT system should work fine!

