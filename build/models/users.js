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
    password: {
        type: String,
    },
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const user = mongoose.model("user", UserSchema);
export default user;
//# sourceMappingURL=users.js.map