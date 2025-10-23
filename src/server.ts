import {
  handleAdduser,
  handleSignIn,
  handleDeleteUser,
  handleGetUser,
  handleUpdatePassword,
  handleUpdateuserInfo,
  handleSignUpUser,
  refreshUserAccessToken,
  handleSignOut,
  handleGetUsers
} from "./handlers/authentication";
import "dotenv/config";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import cron from "node-cron";
import BackupSettings from "./models/backupsettings";
import { authMiddleware } from "middlware/middleware";
import { initializeDatabaseConnection } from "@/utils/storage";
import { handleAddlesson, handleDeleteLesson, handleEnrolltoLesson, handleGetLesson, handleGetLessons, handleGetupcomingLessons, handlePublishLesson, handleUpdateLesson } from "./handlers/lessons";
import { handleAddmodule, handleUpdatemodule, handleGetmodules, handleGetmodule, handleDeletemodule } from "./handlers/modules";
import { handleAddquestion, handleUpdatequestion, handleGetquestions, handleGetquestion, handleDeletequestion } from "./handlers/questions";
import { handleAddcertification, handleUpdatecertification, handleGetcertifications, handleGetcertification, handleDeletecertification, handleGetUserCerts } from "./handlers/certification";
import { getDashboardData, getDashboardDataByUserId } from "./handlers/analysis";
import { backupMongoDBRemote, handleGetBackups } from "./handlers/backup";
import { handleAddresult, handleGetresults, handleGetresult } from "./handlers/results";

initializeDatabaseConnection();

const app = express();
const server = createServer(app);
const users = {};

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔹 Enhanced CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-platform', 'x-device-id', 'x-device-model', 'x-device-name', 'x-device-os', 'x-type', 'x-device-platform']
}));

// 🔹 Enhanced Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// app.use(express.text());
// app.use(express.raw());

// 🔹 File upload setup
const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io
io.on("connection", (socket) => {
  const userId = socket.handshake.headers["x-user-id"] as string;
  if (userId !== undefined && userId !== "undefined") {
    users[userId] = socket.id;
  }
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
    if(users[userId]) {
      delete users[userId];
    }
  });
});

export function sendMessageToUser(userId: string, event: string, message: any) {
  const socketId = users[userId];
  if (socketId) {
    io.to(socketId).emit(event, message);
  } else {
    console.log(`User ${userId} not connected`);
  }
}

// 🔹 Your existing routes
app.post("/user/signin", handleSignIn);
app.post("/user/signup", handleSignUpUser);
app.get("/user", authMiddleware, handleGetUser);
app.get("/users", authMiddleware, handleGetUsers);
app.post("/user/add", authMiddleware, handleAdduser);
app.post("/user/signout", authMiddleware, handleSignOut);
app.delete("/users/:id", authMiddleware, handleDeleteUser);
app.post("/user/update", authMiddleware, handleUpdateuserInfo);
app.get("/user/refresh", authMiddleware, refreshUserAccessToken);
app.post("/user/update/password", authMiddleware, handleUpdatePassword);
app.get("/user/dashboard", authMiddleware, getDashboardDataByUserId);

app.get("/analysis", authMiddleware, getDashboardData);

app.post("/lesson", authMiddleware, handleAddlesson);
app.post("/lesson/enroll", authMiddleware, handleEnrolltoLesson);
app.post("/lesson/:id", authMiddleware, handleUpdateLesson);
app.post("/lesson/:id/publish", authMiddleware, handlePublishLesson);
app.get("/lessons", authMiddleware, handleGetLessons);
app.get("/lessons/upcoming", authMiddleware, handleGetupcomingLessons);
app.get("/lesson/:id", authMiddleware, handleGetLesson);
app.delete("/lesson/:id", authMiddleware, handleDeleteLesson);

app.post("/module", authMiddleware, handleAddmodule);
app.post("/module/:id", authMiddleware, handleUpdatemodule);
app.get("/modules", authMiddleware, handleGetmodules);
app.get("/module/:id", authMiddleware, handleGetmodule);
app.delete("/module/:id", authMiddleware, handleDeletemodule);

app.post("/result", authMiddleware, handleAddresult);
app.get("/results", authMiddleware, handleGetresults);
app.get("/result/:id", authMiddleware, handleGetresult);

app.post("/question", authMiddleware, handleAddquestion);
app.post("/question/:id", authMiddleware, handleUpdatequestion);
app.get("/questions", authMiddleware, handleGetquestions);
app.get("/question/:id", authMiddleware, handleGetquestion);
app.delete("/question/:id", authMiddleware, handleDeletequestion);

app.post("/certification", authMiddleware, handleAddcertification);
app.post("/certification/:id", authMiddleware, handleUpdatecertification);
app.get("/certifications", authMiddleware, handleGetcertifications);
app.get("/user/certifications", authMiddleware, handleGetUserCerts);
app.get("/certification/:id", authMiddleware, handleGetcertification);
app.delete("/certification/:id", authMiddleware, handleDeletecertification);

app.get("/backup", authMiddleware, handleGetBackups)

app.post("/backup", async (req, res) => {
  try {
    await backupMongoDBRemote(process.env.MONGODB_URI, process.env.MONGODB_NAME);

    const settings = await BackupSettings.findOne();
    if (settings) {
      settings.lastBackup = new Date();
      await settings.save();
    }

    res.json({ success: true, message: "Backup created successfully" });
  } catch (err) {
    res.status(500).json({ message: "internal error" });
  }
});

// 🔹 Error Handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// 🔹 404 Handler
app.use('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

cron.schedule("0 * * * *", async () => {
  const settings = await BackupSettings.findOne();

  if (!settings) return;

  const now = new Date();
  let shouldBackup = false;

  if (settings.interval === "daily") {
    shouldBackup = !settings.lastBackup || (now.getTime() - settings.lastBackup.getTime()) > 24 * 60 * 60 * 1000;
  } else if (settings.interval === "weekly") {
    shouldBackup = !settings.lastBackup || (now.getTime() - settings.lastBackup.getTime()) > 7 * 24 * 60 * 60 * 1000;
  } else if (settings.interval === "monthly") {
    shouldBackup = !settings.lastBackup || (now.getTime() - settings.lastBackup.getTime()) > 30 * 24 * 60 * 60 * 1000;
  }

  if (shouldBackup) {
    await backupMongoDBRemote(process.env.MONGODB_URI, process.env.MONGODB_NAME);
    settings.lastBackup = now;
    await settings.save();
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server and Socket.IO running on port: ${process.env.PORT}`);
});