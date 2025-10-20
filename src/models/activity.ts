import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ActivitySchema = new Schema(
  {
    user: { type: String, required: true }, // or ObjectId ref to User
    course: { type: String, required: true }, // or ObjectId ref to Lesson
    type: { type: String, enum: ["enrollment", "completion", "certificate", "quiz"], required: true },
    icon: { type: String }, // e.g., "UserPlus", "CheckCircle"
  },
  { timestamps: true }
);

const activity = mongoose.model("activity", ActivitySchema);
export default activity;