import express from 'express';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js'; 
import cors from 'cors';
import cookieParser from 'cookie-parser';

//import routes
import authRoutes from './routes/authRoutes.js';
import sidebarRoutes from './routes/sidebarRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import profilesRoutes from './routes/profilesRoutes.js';
import gradesRoutes from './routes/gradesRoutes.js';
import subjectsRoutes from './routes/subjectsRoutes.js';
import contentsRoutes from './routes/contentsRoutes.js';
import subcontentsRoutes from './routes/subcontentsRoutes.js';
import quizzesRoutes from './routes/quizzesRoutes.js';
import channelsRoutes from './routes/channelsRoutes.js';
import likesRoutes from './routes/likesRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';
import favoritesQuizRoutes from './routes/favoritesQuizRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
config(); // Load environment variables from .env file

connectDB(); // Connect to the database

const app = express();

//body parser middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://127.0.0.1:5500", "https://www.addisschool.com", "https://addisschool.com","http://localhost:3000"],
  credentials: true
}));

//API Routes
app.use("/api/v1/auth", authRoutes); // Use auth routes for authentication-related endpoints
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/sidebar", sidebarRoutes); // Use sidebar routes for sidebar-related endpoints
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/profiles", profilesRoutes);
app.use("/api/v1/grades", gradesRoutes);
app.use("/api/v1/subjects", subjectsRoutes);
app.use("/api/v1/contents", contentsRoutes);
app.use("/api/v1/subcontents", subcontentsRoutes);
app.use("/api/v1/quizzes", quizzesRoutes);
app.use("/api/v1/channels", channelsRoutes);
app.use("/api/v1/likes", likesRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/youtube", youtubeRoutes);
app.use("/api/v1/favorites", favoritesQuizRoutes);
app.use("/api/v1/avatar", avatarRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
console. error("Unhandled Rejection:", err) ;
server.close(async () => {
await disconnectDB();
process.exit(1);
});
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
console.error("Uncaught Exception:", err);
await disconnectDB();
process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
console. log ("SIGTERM received, shutting down gracefully");
server.close(async () => {
await disconnectDB();
process.exit(0);
});
});