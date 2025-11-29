# MongoDB Atlas Setup

## Connection String

Your MongoDB Atlas connection string has been configured in `.env`:

```
MONGODB_URI=mongodb+srv://routely_db_user:Spnittes060610@cluster0.q6fxjva.mongodb.net/routely?retryWrites=true&w=majority
```

## Database Configuration

The connection string includes:
- **Database Name**: `routely`
- **Authentication**: Username/password authentication
- **Cluster**: `cluster0.q6fxjva.mongodb.net`
- **Options**: Retry writes enabled, write concern majority

## Important Notes

1. **IP Whitelist**: Make sure your IP address is whitelisted in MongoDB Atlas Network Access settings
   - Go to MongoDB Atlas → Network Access → Add IP Address
   - Add `0.0.0.0/0` for all IPs (development only, not recommended for production)
   - Or add your specific IP address

2. **Database User**: Ensure the database user `routely_db_user` has proper permissions:
   - Go to MongoDB Atlas → Database Access
   - User should have "Read and write to any database" or specific permissions to the `routely` database

3. **Connection Security**: The connection uses SSL/TLS by default (mongodb+srv://)

## Testing the Connection

To test if the connection works:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the console for:
   ```
   ✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
   ```

3. If you see connection errors:
   - Check MongoDB Atlas Network Access (IP whitelist)
   - Verify database user credentials
   - Check if the cluster is running

## Environment Variables

The `.env` file in the `backend` directory contains:
- `MONGODB_URI`: Your Atlas connection string
- `NODE_ENV`: development/production
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS

## Security Reminder

⚠️ **Never commit the `.env` file to version control!**

The `.env` file is already in `.gitignore` to prevent accidental commits.

