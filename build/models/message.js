import mongoose from "mongoose";
const MessageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "sent", "delivered", "read"],
        default: "pending"
    }
});
const message = mongoose.model("message", MessageSchema);
export default message;
//# sourceMappingURL=message.js.map