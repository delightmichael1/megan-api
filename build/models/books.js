import mongoose from "mongoose";
const Schema = mongoose.Schema;
// creating the actual mongoose schema
const UserSchema = new Schema({
    title: {
        type: String,
    },
    filePath: {
        type: String,
    },
    fileName: {
        type: String,
    },
    thumbnailPath: {
        type: String,
    }
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const book = mongoose.model('book', UserSchema);
export default book;
//# sourceMappingURL=books.js.map