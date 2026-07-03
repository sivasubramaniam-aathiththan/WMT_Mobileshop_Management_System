import jwt from 'jsonwebtoken'; 
import User from "../models/user.js";

export const isAuth = async (req, res, next) => {
    try {
        // ✅ reads both header formats
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.headers.token;

        if (!token) {
            return res.status(403).json({
                message: "please login to enable access"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(403).json({
                message: "user not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(403).json({
            message: "invalid or expired token"
        });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            message: "Access denied. Admin role required."
        });
    }
};