const express = require("express");
const cors = require("cors");
const authMiddleware = require("./middleware/authMiddleware");
const { errorHandler } = require("./middleware/errorHandler");
const db = require("./db/db");

// Routes
const userRoute = require("./routes/userRoutes");
const materialRoute = require("./routes/materialsRoute");
const quotationRoute = require("./routes/quotationRoute");
const quotationRoomsRoute = require("./routes/quotationRoomsRoute");
const roomMaterialsRoute = require("./routes/roomMaterialsRoute");
const clientsRoute = require("./routes/clientsRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const projectRoutes = require('./routes/projectRoute');

const app = express();

// CORS - Properly configured
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Register all API routes
app.use("/api/v1/", userRoute);
app.use("/api/v1/", materialRoute);
app.use("/api/v1/", quotationRoute);
app.use("/api/v1", quotationRoomsRoute);
app.use("/api/v1", roomMaterialsRoute);
app.use("/api/v1", clientsRoute);
app.use("/api/v1", dashboardRoute);
app.use('/api/v1', projectRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Test DB connection before starting the server
db.query("SELECT 1")
    .then(() => {
        console.log("✅ Database connected successfully");
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error("❌ Failed to connect to database:", err.message);
        process.exit(1);
    });