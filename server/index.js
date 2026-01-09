const express = require("express");
const authMiddleware = require("./middleware/authMiddleware");
const db = require("./db/db");
const userRoute = require("./routes/userRoutes")
const materialRoute = require("./routes/materialsRoute")
const quotationRoute = require("./routes/quotationRoute")
const quotationRoomsRoute = require("./routes/quotationRoomsRoute");
const roomMaterialsRoute = require("./routes/roomMaterialsRoute");
const clientsRoute = require("./routes/clientsRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const cors = require("cors")
const projectRoutes = require('./routes/projectRoute');


const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Register all API routes
app.use("/api/v1/", userRoute)
app.use("/api/v1/", materialRoute)
app.use("/api/v1/", quotationRoute)
app.use("/api/v1", quotationRoomsRoute)
app.use("/api/v1", roomMaterialsRoute)
app.use("/api/v1", clientsRoute)
app.use("/api/v1", dashboardRoute)
app.use('/api/v1', projectRoutes); 


app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});


const PORT = process.env.PORT || 3001;

// Test DB connection before starting the server
db.query("SELECT 1")
    .then(() => {
        console.log("✅ Database connected successfully");
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    })
    .catch((err) => {
        console.error("❌ Failed to connect to database:", err.message);
        process.exit(1); // Exit process to fail the deployment explicitly
    });