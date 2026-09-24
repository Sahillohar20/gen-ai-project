const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

async function authUser(req, res, next) {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        message: "Token not provided. Please log in."
      });
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token });

    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: "Token is invalid."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    return next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

module.exports = { authUser };
