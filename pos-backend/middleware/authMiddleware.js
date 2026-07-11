const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        if (err) {
            // 401 (not 403) so clients know to re-authenticate;
            // 403 is reserved for valid tokens with insufficient role
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        req.user = user;

        next();
    });
};

module.exports = authenticateToken;