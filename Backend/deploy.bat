@echo off
REM WorkSmartAI Backend Deployment Script for Windows
REM This script helps prepare the backend for deployment on Render

echo 🚀 WorkSmartAI Backend Deployment Preparation
echo =============================================

REM Check if we're in the Backend directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the Backend directory
    pause
    exit /b 1
)

REM Check if all required files exist
echo 📋 Checking required files...
if exist "server.js" (
    echo ✅ server.js
) else (
    echo ❌ Missing: server.js
    pause
    exit /b 1
)

if exist "package.json" (
    echo ✅ package.json
) else (
    echo ❌ Missing: package.json
    pause
    exit /b 1
)

if exist "connect\connectDB.js" (
    echo ✅ connect\connectDB.js
) else (
    echo ❌ Missing: connect\connectDB.js
    pause
    exit /b 1
)

REM Check package.json for required scripts
echo 📦 Checking package.json...
findstr /C:"\"start\": \"node server.js\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✅ Start script configured correctly
) else (
    echo ❌ Start script not found or incorrect
    pause
    exit /b 1
)

REM Check for required dependencies
echo 🔍 Checking dependencies...
findstr /C:"\"express\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✅ express
) else (
    echo ❌ Missing dependency: express
    pause
    exit /b 1
)

findstr /C:"\"mongoose\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✅ mongoose
) else (
    echo ❌ Missing dependency: mongoose
    pause
    exit /b 1
)

findstr /C:"\"cors\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✅ cors
) else (
    echo ❌ Missing dependency: cors
    pause
    exit /b 1
)

findstr /C:"\"dotenv\"" package.json >nul
if %errorlevel% equ 0 (
    echo ✅ dotenv
) else (
    echo ❌ Missing dependency: dotenv
    pause
    exit /b 1
)

echo.
echo ✅ Backend is ready for deployment!
echo.
echo 📝 Next steps:
echo 1. Push your code to GitHub
echo 2. Go to https://dashboard.render.com/
echo 3. Create a new Web Service
echo 4. Connect your GitHub repository
echo 5. Set Root Directory to 'Backend'
echo 6. Set Build Command to 'npm install'
echo 7. Set Start Command to 'npm start'
echo 8. Add environment variables:
echo    - NODE_ENV=production
echo    - MONGO_URI=your_mongodb_connection_string
echo    - FRONTEND_URL=https://worksmart-ai.vercel.app
echo    - JWT_SECRET=your_strong_jwt_secret
echo 9. Deploy!
echo.
echo 🔗 Your backend will be available at: https://your-service-name.onrender.com
pause 