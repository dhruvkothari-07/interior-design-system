const express = require("express");
const authMiddleware = require("./middleware/authMiddleware");
const db = require("./db/db");
const userRoute = require("./routes/userRoutes")


const app = express();
app.use(express.json());

app.use("/api/v1/", userRoute)
// app.use("/materials", authMiddleware, materialsRoute)

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});