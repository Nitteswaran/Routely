# Registration Troubleshooting Guide

If you're seeing "Registration failed. Please try again.", follow these steps:

## 1. Check Backend Server

Make sure the backend server is running:

```bash
cd backend
npm run dev
```

You should see:
- ✅ MongoDB Connected: ...
- 🚀 Server started successfully
- 📍 Server running on port 5000

## 2. Check Database Connection

The registration requires MongoDB to be connected. Check if:
- MongoDB is running (local) or MongoDB Atlas connection is configured
- The `MONGODB_URI` environment variable is set correctly in `backend/.env`

## 3. Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for detailed error messages:
- Network errors (connection refused, timeout, etc.)
- API response errors
- CORS errors

## 4. Common Issues

### Issue: "Cannot connect to server"
**Solution:** Make sure the backend server is running on the expected port (default: 5000)

### Issue: "User already exists with this email"
**Solution:** Use a different email address or try logging in instead

### Issue: "Network error" or "ECONNREFUSED"
**Solution:** 
- Check if backend server is running
- Verify the API base URL in frontend environment variables
- Check if CORS is properly configured

### Issue: "Validation error"
**Solution:** Make sure all required fields are filled correctly:
- Name: required
- Email: must be a valid email format
- Password: minimum 6 characters

## 5. Test Registration Endpoint Directly

You can test the registration endpoint directly using curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

Expected successful response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "...",
    "user": {...}
  }
}
```

## 6. Check Backend Logs

Look at the backend server console for error messages when registration fails. Common errors:
- MongoDB connection errors
- Validation errors
- Duplicate key errors

