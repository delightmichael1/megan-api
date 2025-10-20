import mongoose from "mongoose";
const Schema = mongoose.Schema;
const LessonSchema = new Schema({
    category: { type: String },
    title: { type: String },
    duration: { type: Number },
    difficulty: { type: String },
    status: { type: String, default: "draft" },
    enrollments: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    modules: { type: [{ id: String, title: String }], default: [] },
    endDate: { type: Date },
    startDate: { type: Date },
}, { timestamps: true });
const lesson = mongoose.model("lesson", LessonSchema);
export default lesson;
//# sourceMappingURL=lesson.js.map