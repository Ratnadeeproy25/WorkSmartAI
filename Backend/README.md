# WorkSmartAI Backend

This is the backend API for the WorkSmartAI application, built with Node.js, Express, and MongoDB.

## Deployment to Render

### Prerequisites
1. A Render account
2. A MongoDB database (MongoDB Atlas recommended)
3. Your frontend deployed on Vercel

### Environment Variables

Set these environment variables in your Render dashboard:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/worksmartAI
FRONTEND_URL=https://worksmart-ai.vercel.app
JWT_SECRET=your_strong_jwt_secret_here
AI_ENABLED=true
ML_PREDICTION_ENABLED=true
```

### Deployment Steps

1. **Connect your GitHub repository to Render**
   - Go to your Render dashboard
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this backend

2. **Configure the service**
   - **Name**: `worksmart-ai-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `Backend` (if your backend is in a subdirectory)

3. **Set Environment Variables**
   - Add all the environment variables listed above
   - Make sure to use your actual MongoDB connection string
   - Generate a strong JWT secret

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Important Notes

- The backend will be available at `https://your-service-name.onrender.com`
- Update your frontend's API configuration to use the new backend URL
- The health check endpoint is available at `/health`
- CORS is configured to allow requests from your Vercel frontend

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### API Endpoints

- Health Check: `GET /health`
- API Base: `/api`
- Uploads: `/uploads`

### Troubleshooting

1. **Database Connection Issues**
   - Verify your MONGO_URI is correct
   - Ensure your MongoDB cluster allows connections from Render's IP addresses

2. **CORS Issues**
   - Check that FRONTEND_URL is set correctly
   - Verify the frontend URL is in the allowed origins

3. **Build Failures**
   - Ensure all dependencies are in package.json
   - Check that the start script is correct 