import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ResourceSchema = new Schema({
    type: String,
    title: String,
    publicLink: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    downloadLink: String,
    author: String,
    tags: [String],
    authorId: String,
    fileName: String,
    downloads: { type: Number, default: 0 },
}, { timestamps: true });
const resource = mongoose.model("resource", ResourceSchema);
export default resource;
//# sourceMappingURL=resource.js.map