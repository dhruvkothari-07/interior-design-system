const jwt = require("jsonwebtoken");
const dotenv = require("dotenv")
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or malformed" });
    }
    const token = authHeader.split(" ")[1];


    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            console.error("JWT Verification Error:", err.message); // Add this line
            return res.status(403).json({ message: "Invalid or expired token." });
        }
        req.user = decodedUser;
        next();
    });
}

module.exports = authMiddleware;
