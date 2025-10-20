import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ConfigSchema = new Schema({
    maxOrderTime: String,
    OrderTime: String,
    identifier: String
}, { timestamps: true });
const config = mongoose.model("config", ConfigSchema);
export default config;
//# sourceMappingURL=config.js.map