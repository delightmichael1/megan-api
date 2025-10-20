import mongoose from "mongoose";
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: { type: String, required: true },
    title: { type: String },
    yearStarted: { type: String },
    company: { type: String },
    industry: { type: String },
    location: { type: String },
    mentorshipType: { type: String, enum: ["mentor", "mentee", "both"] }, // optional enum
    skills: [{ type: String }], // array of strings
    avatar: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    connections: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });
const user = mongoose.model("user", UserSchema);
export default user;
//# sourceMappingURL=user.js.map