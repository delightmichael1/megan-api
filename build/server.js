import { handleAdduser, handleSignIn, handleDeleteUser, handleGetUser, handleUpdatePassword, handleUpdateuserInfo, handleSignUpUser, refreshUserAccessToken, handleSignOut } from "./handlers/authentication.js";
import "dotenv/config";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import { createServer } from "http";
import express, { urlencoded } from "express";
import { authMiddleware } from "./middlware/middleware.js";
import { initializeDatabaseConnection } from "./utils/storage.js";
import { handleGetMessages, handleGetUnreadMessages, handleSendMessage } from "./handlers/messages.js";
import { handleAddResource, handleDownloadResource, handleGetResources } from "./handlers/resources.js";
import { handleAcceptConnection, handleCreateconnection, handleGetAllConnections, handleGetAllUsers, handleGetConnectionRequests } from "./handlers/connections.js";
import { handleAIConversation } from "./handlers/ai_conversation.js";
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
app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: false }));
// 🔹 File upload setup
const upload = multer({ storage: multer.memoryStorage() });
// Socket.io
io.on("connection", (socket) => {
    const userId = socket.handshake.headers["x-user-id"];
    if (userId !== undefined && userId !== "undefined") {
        users[userId] = socket.id;
    }
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("user disconnected");
        if (users[userId]) {
            delete users[userId];
        }
    });
});
export function sendMessageToUser(userId, event, message) {
    const socketId = users[userId];
    if (socketId) {
        io.to(socketId).emit(event, message);
    }
    else {
        console.log(`User ${userId} not connected`);
    }
}
app.post("/user/signin", handleSignIn);
app.post("/user/signup", handleSignUpUser);
app.get("/user", authMiddleware, handleGetUser);
app.post("/user/add", authMiddleware, handleAdduser);
app.get("/users", authMiddleware, handleGetAllUsers);
app.post("/user/signout", authMiddleware, handleSignOut);
app.delete("/users/:id", authMiddleware, handleDeleteUser);
app.post("/user/update", authMiddleware, handleUpdateuserInfo);
app.get("/user/refresh", authMiddleware, refreshUserAccessToken);
app.post("/user/update/password", authMiddleware, handleUpdatePassword);
app.post("/ai", authMiddleware, handleAIConversation);
app.get("/connections", authMiddleware, handleGetAllConnections);
app.post("/connection/accept", authMiddleware, handleAcceptConnection);
app.post("/connection/request", authMiddleware, handleCreateconnection);
app.get("/connection/requests", authMiddleware, handleGetConnectionRequests);
app.get("/resources", authMiddleware, handleGetResources);
app.get("/resource/download/:file", handleDownloadResource);
app.post("/resource", authMiddleware, upload.single('file'), handleAddResource);
app.get("/messages", authMiddleware, handleGetMessages);
app.post("/messages", authMiddleware, handleSendMessage);
app.delete("/messagge", authMiddleware, handleSendMessage);
app.get("/messages/unread", authMiddleware, handleGetUnreadMessages);
server.listen(process.env.PORT, () => {
    console.log(`Server and Socket.IO running on port: ${process.env.PORT}`);
});
//# sourceMappingURL=server.js.map