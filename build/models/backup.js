import mongoose from "mongoose";
const Schema = mongoose.Schema;
const BackupSchema = new Schema({
    url: String,
    size: String,
    filePath: String,
}, { timestamps: true });
const backup = mongoose.model("backup", BackupSchema);
export default backup;
//# sourceMappingURL=backup.js.map