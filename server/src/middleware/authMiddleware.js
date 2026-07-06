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

    // Supabase user id is inside "sub"
    req.userId = decoded.id;
    req.user = decoded;

    next();

  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ error: "Invalid accessToken" });
  }

}