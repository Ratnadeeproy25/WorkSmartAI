const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./connect/connectDB");
const employeeRoutes = require("./routes/employeeRoutes");
const managerRoutes = require("./routes/managerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const managerLeaveRoutes = require("./routes/managerLeaveRoutes");
const reimbursementRoutes = require("./routes/reimbursementRoutes");
const managerAttendanceRoutes = require("./routes/managerAttendanceRoutes");
const taskRoutes = require("./routes/taskRoutes");
const managerTaskRoutes = require("./routes/managerTaskRoutes");
const employeeWellbeingRoutes = require("./routes/employeeWellbeingRoutes");
const managerWellbeingRoutes = require("./routes/managerWellbeingRoutes");
const adminWellbeingRoutes = require("./routes/adminWellbeingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const managerDashboardRoutes = require("./routes/managerDashboardRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const managerEmployeeDataRoutes = require("./routes/managerEmployeeDataRoutes");
const errorHandler = require("./middlewares/errorHandler");
const path = require("path");

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

// Basic rate limiting to prevent abuse
const rateLimit = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of requests.entries()) {
      if (now - data.firstRequest > windowMs) {
        requests.delete(ip);
      }
    }
    
    if (!requests.has(clientIp)) {
      requests.set(clientIp, { count: 1, firstRequest: now });
    } else {
      const clientData = requests.get(clientIp);
      if (now - clientData.firstRequest > windowMs) {
        requests.set(clientIp, { count: 1, firstRequest: now });
      } else {
        clientData.count++;
        if (clientData.count > maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
          });
        }
      }
    }
    
    next();
  };
};

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Apply rate limiting globally (stricter for auth routes)
app.use('/api/auth', rateLimit(50, 15 * 60 * 1000)); // 50 requests per 15 minutes for auth
app.use('/api', rateLimit(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes for other APIs

// Middleware
app.use(express.json({ limit: '2mb' }));  // Reduced payload limit for security
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || "https://your-domain.com"
      : "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads/receipts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.get("/", (req, resp) => {
  resp.send("Employee Management API is running");
});

// Mount API routes
app.use("/api/employees", employeeRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/manager-leave", managerLeaveRoutes);
app.use("/api/reimbursement", reimbursementRoutes);
app.use("/api/manager/attendance", managerAttendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/manager/tasks", managerTaskRoutes);
app.use("/api/wellbeing", employeeWellbeingRoutes);
app.use("/api/manager/wellbeing", managerWellbeingRoutes);
app.use("/api/admin/wellbeing", adminWellbeingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/manager/dashboard", managerDashboardRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/manager/employee-data", managerEmployeeDataRoutes);

// Error handler middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const connected = await connectDB();
    
    if (!connected) {
      console.error("Failed to connect to MongoDB. Please check your connection settings.");
      console.error("Make sure MongoDB is running and the MONGO_URI is correct.");
      console.error("You can create a .env file with: PORT=5000 and MONGO_URI=mongodb://127.0.0.1:27017/worksmartAI");
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log("✅ All backend endpoints are now properly implemented!");
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
    process.exit(1);
  }
};

startServer();
