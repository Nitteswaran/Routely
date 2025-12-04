# How to Start Routely Application

## Prerequisites

Make sure you have:
- Node.js installed (v18 or higher)
- npm or yarn installed
- MongoDB running (local or MongoDB Atlas connection)

## Step 1: Start the Backend Server

1. Open a terminal/command prompt
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Create a `.env` file in the `backend` folder if it doesn't exist:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/routely
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/routely
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRE=30d
   FRONTEND_URL=http://localhost:5173
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ MongoDB Connected: ...
   🚀 Server started successfully
   📍 Server running on port 5000
   ```

   **Keep this terminal open!** The backend server must keep running.

## Step 2: Start the Frontend Development Server

1. Open a **NEW** terminal/command prompt (keep the backend terminal running)
2. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Start the frontend server:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   VITE v...
   ➜  Local:   http://localhost:5173/
   ```

5. Open your browser and go to: `http://localhost:5173`

## Troubleshooting

### Backend won't start

- **MongoDB connection error**: Make sure MongoDB is running (if local) or your MongoDB Atlas connection string is correct
- **Port 5000 already in use**: Change the PORT in `backend/.env` to a different port (e.g., 5001)

### Frontend can't connect to backend

- Make sure the backend server is running (check terminal for "Server started successfully")
- Check that the backend is on port 5000 (or the port specified in your .env)
- If you changed the backend port, update `VITE_API_BASE_URL` in frontend `.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:5000
  ```

### Registration/Login not working

- Make sure both backend AND frontend servers are running
- Check browser console (F12) for error messages
- Check backend terminal for error logs

## Quick Start Commands

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Then open: http://localhost:5173

