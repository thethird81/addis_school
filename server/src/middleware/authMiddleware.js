import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

export async function authMiddleware(req, res, next) {

  let accessToken;

  // // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    accessToken = req.headers.authorization.split(" ")[1];
    console.log("accessToken from header:", accessToken);
  } 
  // Otherwise check cookie

  // if (req.cookies?.accessToken) {
  //   accessToken = req.cookies.accessToken;
  //   console.log("accessToken from cookie:", accessToken);
  // }

  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized - No accessToken" });
  }

  try { 

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    console.log("Decoded accessToken:", decoded);

    // User id is in the "sub" claim
    req.userId = decoded.sub;
    req.user = decoded;

    next();

  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ error: "Invalid accessToken" });
  }

}

/**
 * Authorization middleware factory - restricts access based on user roles
 * @param  {...string} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Express middleware
 */
export function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    // Ensure authMiddleware has run and req.user exists
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized - Authentication required" });
    }

    // Check if user's role is in the allowed roles
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Forbidden - Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: userRole 
      });
    }

    next();
  };
}
