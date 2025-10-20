const jwt = require("jsonwebtoken")
const JWT_SECRET = "dsamdas"

function authMiddleware(req, res, next) {
    const authheaders = req.headers["authorization"]
    const token = authheaders.split(" ")[1];
    if (!token) {
        return res.json({ message: "token required" })
    }
    const decoded = jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }
    })
    req.userId = decodedUser;

}
module.exports = authMiddleware;