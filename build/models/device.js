import mongoose from "mongoose";
const Schema = mongoose.Schema;
const DeviceSchema = new Schema({
    userId: String,
    deviceIP: String,
    lastSeen: String,
    deviceID: String,
    deviceType: String,
    deviceName: String,
    deviceToken: String,
    refreshToken: String,
}, { timestamps: true });
const device = mongoose.model("device", DeviceSchema);
export default device;
//# sourceMappingURL=device.js.map