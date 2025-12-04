# Clerk Authentication Setup Guide

## Quick Start

1. **Get your Clerk Publishable Key**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)
   - Select **React** from the framework dropdown
   - Copy your **Publishable Key**

2. **Create `.env.local` file in the `frontend` folder**
   ```bash
   cd frontend
   ```
   
   Create `.env.local` with:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY_HERE
   ```

3. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Test the integration**
   - Open http://localhost:5173
   - Click "Sign Up" or "Sign In" in the navbar
   - Clerk modal will appear for authentication

## What's Been Integrated

✅ **ClerkProvider** - Wrapped in `main.jsx`  
✅ **Protected Routes** - Using Clerk's `useAuth` hook  
✅ **Navbar** - Shows Sign In/Sign Up buttons for unauthenticated users, UserButton for authenticated users  
✅ **Home Page** - Shows different content based on authentication status  
✅ **Forum** - Only authenticated users can post  

## Components Updated

- `frontend/src/main.jsx` - Added ClerkProvider
- `frontend/src/components/ProtectedRoute.jsx` - Uses Clerk's `useAuth`
- `frontend/src/components/Navbar.jsx` - Uses Clerk components (SignedIn, SignedOut, SignInButton, SignUpButton, UserButton)
- `frontend/src/pages/Home.jsx` - Uses SignedIn/SignedOut components
- `frontend/src/App.jsx` - Removed Login/Register routes (Clerk handles this)

## Next Steps (Backend Integration)

To fully integrate Clerk with your backend:

1. **Install Clerk Backend SDK** in your backend:
   ```bash
   cd backend
   npm install @clerk/clerk-sdk-node
   ```

2. **Update backend authentication middleware** to verify Clerk tokens instead of JWT

3. **Sync Clerk users with MongoDB** - Create user records when they first sign in

4. **Update API endpoints** to work with Clerk user IDs

## Important Notes

- The `VITE_` prefix is required for Vite to expose environment variables
- `.env.local` is already in `.gitignore` - your keys are safe
- Clerk handles all authentication UI (sign-in, sign-up, password reset, etc.)
- No need for custom Login/Register pages anymore

