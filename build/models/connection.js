import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ConnectionSchema = new Schema({
    user1: String,
    user2: String,
}, { timestamps: true });
const connection = mongoose.model("connection", ConnectionSchema);
export default connection;
//# sourceMappingURL=connection.js.map