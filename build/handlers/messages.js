import jwt from "jsonwebtoken";
import message from "../models/message.js";
import { sendMessageToUser } from "../server.js";
export const handleSendMessage = async (req, res) => {
    try {
        await message.create(req.body);
        sendMessageToUser(req.body.receiver, "new:message", req.body);
        res.status(201).json({ message: "Message sent" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const handleGetMessages = async (req, res) => {
    try {
        const { id } = req.query;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decodedToken._id;
        if (!id) {
            return res.status(400).json({ success: false, message: "id query parameter required" });
        }
        const messages = await message.find({
            $or: [{ sender: id, receiver: userId }, { receiver: id, sender: userId }],
        });
        for (var msg of messages) {
            if (msg.receiver === userId && msg.status !== "delivered") {
                msg.status = "delivered";
                await msg.save();
            }
        }
        res.status(200).json({ count: messages.length, messages: messages });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleGetUnreadMessages = async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decodedToken._id;
        const messages = await message.find({
            receiver: id,
            status: "sent",
        });
        res.status(200).json({ messages: messages });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleDeleteMessage = async (req, res) => message
    .deleteOne({ _id: req.params.id })
    .then(() => {
    res.status(200).json({ message: "Message deleted" });
})
    .catch((error) => {
    res.status(500).json({ message: error.message });
});
//# sourceMappingURL=messages.js.map