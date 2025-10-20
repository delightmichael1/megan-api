import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
    name: { type: String, required: true },
    title: { type: String },
    department: { type: String },
    progress: {type: Number, default: 0},
    permissions: { type: [String] },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastLogin: { type: String, default: "" },
    enrolledLessons: [{ type: Schema.Types.ObjectId, ref: 'lesson' }],
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'lesson' }],
    certificates: [{ lessonId: String, earnedDate: Date }],
    completedModules: [String],
    learningStreak: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 }, 
  },
  { timestamps: true }
);

const user = mongoose.model("user", UserSchema);
export default user;
