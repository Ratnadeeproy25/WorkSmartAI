# WorkSmartAI Deployment Guide

This guide will help you deploy the WorkSmartAI application with the frontend on Vercel and backend on Render.

## Current Status

- ✅ **Frontend**: Deployed on Vercel at https://worksmart-ai.vercel.app/
- 🔄 **Backend**: Ready for deployment on Render

## Backend Deployment on Render

### Step 1: Prepare Your Repository

1. **Ensure your repository is up to date** with the latest changes
2. **Verify the backend structure**:
   ```
   Backend/
   ├── server.js
   ├── package.json
   ├── connect/
   ├── controllers/
   ├── models/
   ├── routes/
   └── ...
   ```

### Step 2: Deploy to Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Sign in or create an account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your WorkSmartAI repository

3. **Configure the Service**
   - **Name**: `worksmart-ai-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set Environment Variables**
   Add these in the Render dashboard:
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://mrroy251998:Password@cluster0.szumu18.mongodb.net/
   FRONTEND_URL=https://worksmart-ai.vercel.app
   JWT_SECRET=your_strong_jwt_secret_here
   AI_ENABLED=true
   ML_PREDICTION_ENABLED=true
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete (usually 2-5 minutes)

### Step 3: Get Your Backend URL

After deployment, your backend will be available at:
```
https://worksmart-ai-backend.onrender.com
```

## Frontend Configuration

### Step 1: Update API Configuration

The frontend has been updated to use the Render backend by default. If you need to change the backend URL:

1. **For Production**: The frontend will automatically use the Render backend
2. **For Development**: Set `REACT_APP_API_URL=http://localhost:5000/api` in your local `.env` file

### Step 2: Redeploy Frontend (if needed)

If you need to update the frontend:

1. **Push changes to GitHub**
2. **Vercel will automatically redeploy** (if auto-deploy is enabled)
3. **Or manually redeploy** from the Vercel dashboard

## Testing the Deployment

### 1. Test Backend Health
Visit: `https://worksmart-ai-backend.onrender.com/health`
Expected response:
```json
{
  "status": "OK",
  "message": "WorkSmartAI Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 2. Test Frontend
Visit: https://worksmart-ai.vercel.app/
- Try logging in with test credentials
- Test the main functionality

### 3. Test API Endpoints
Test a simple API call:
```bash
curl https://worksmart-ai-backend.onrender.com/api/employees
```

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
MONGO_URI=mongodb+srv://mrroy251998:Password@cluster0.szumu18.mongodb.net/
FRONTEND_URL=https://worksmart-ai.vercel.app
JWT_SECRET=your_strong_jwt_secret_here
AI_ENABLED=true
ML_PREDICTION_ENABLED=true
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://worksmart-ai-backend.onrender.com/api
```

## Troubleshooting

### Common Issues

1. **Backend Build Fails**
   - Check that all dependencies are in `package.json`
   - Verify the start script is `npm start`
   - Check the build logs in Render dashboard

2. **Database Connection Issues**
   - Verify your MongoDB URI is correct
   - Ensure MongoDB Atlas allows connections from Render
   - Check if your MongoDB cluster is active

3. **CORS Errors**
   - Verify `FRONTEND_URL` is set correctly in Render
   - Check that the frontend URL is in the allowed origins list

4. **Frontend Can't Connect to Backend**
   - Verify the backend URL in the frontend configuration
   - Check that the backend is running and healthy
   - Test the health endpoint

### Useful Commands

```bash
# Test backend locally
cd Backend
npm install
npm start

# Test frontend locally
cd Frontend
npm install
npm start
```

## Monitoring

### Render Dashboard
- Monitor your backend service health
- Check logs for errors
- Monitor resource usage

### Vercel Dashboard
- Monitor frontend deployment
- Check analytics and performance
- View function logs

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **MongoDB**: Use strong passwords and enable network access controls
3. **JWT Secret**: Use a strong, unique secret for production
4. **CORS**: Only allow necessary origins
5. **Rate Limiting**: The backend includes rate limiting to prevent abuse

## Support

If you encounter issues:
1. Check the deployment logs in Render/Vercel dashboards
2. Verify all environment variables are set correctly
3. Test endpoints individually to isolate issues
4. Check the browser console for frontend errors

## Final URLs

- **Frontend**: https://worksmart-ai.vercel.app/
- **Backend**: https://worksmart-ai-backend.onrender.com
- **Backend Health**: https://worksmart-ai-backend.onrender.com/health 