import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ConnectionRequestSchema = new Schema({
    user1: String,
    user2: String,
}, { timestamps: true });
const connectionRequest = mongoose.model("connectionRequest", ConnectionRequestSchema);
export default connectionRequest;
//# sourceMappingURL=connectionRequest.js.map