#!/bin/bash

# WorkSmartAI Backend Deployment Script
# This script helps prepare the backend for deployment on Render

echo "🚀 WorkSmartAI Backend Deployment Preparation"
echo "============================================="

# Check if we're in the Backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Backend directory"
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."
required_files=("server.js" "package.json" "connect/connectDB.js")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

# Check package.json for required scripts
echo "📦 Checking package.json..."
if grep -q '"start": "node server.js"' package.json; then
    echo "✅ Start script configured correctly"
else
    echo "❌ Start script not found or incorrect"
    exit 1
fi

# Check for required dependencies
echo "🔍 Checking dependencies..."
required_deps=("express" "mongoose" "cors" "dotenv")
for dep in "${required_deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "✅ $dep"
    else
        echo "❌ Missing dependency: $dep"
        exit 1
    fi
done

echo ""
echo "✅ Backend is ready for deployment!"
echo ""
echo "📝 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Go to https://dashboard.render.com/"
echo "3. Create a new Web Service"
echo "4. Connect your GitHub repository"
echo "5. Set Root Directory to 'Backend'"
echo "6. Set Build Command to 'npm install'"
echo "7. Set Start Command to 'npm start'"
echo "8. Add environment variables:"
echo "   - NODE_ENV=production"
echo "   - MONGO_URI=your_mongodb_connection_string"
echo "   - FRONTEND_URL=https://worksmart-ai.vercel.app"
echo "   - JWT_SECRET=your_strong_jwt_secret"
echo "9. Deploy!"
echo ""
echo "🔗 Your backend will be available at: https://your-service-name.onrender.com" 