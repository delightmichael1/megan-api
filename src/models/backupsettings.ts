import mongoose from "mongoose";

const BackupSettingsSchema = new mongoose.Schema({
  interval: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
  lastBackup: { type: Date, default: null },
});

export default mongoose.model("BackupSettings", BackupSettingsSchema);
