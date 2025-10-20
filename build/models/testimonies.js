import mongoose from "mongoose";
const Schema = mongoose.Schema;
// creating the actual mongoose schema
const UserSchema = new Schema({
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    city: {
        type: String,
    },
    country: {
        type: String,
    },
    title: {
        type: String,
    },
    filePath: {
        type: String,
    },
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const testimony = mongoose.model("testimony", UserSchema);
export default testimony;
//# sourceMappingURL=testimonies.js.map