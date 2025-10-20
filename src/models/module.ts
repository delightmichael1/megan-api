import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ModuleSchema = new Schema(
  {
    title: String,
    content: String,
    duration: Number,
    lessonId: String,
    quizQuestions: [String]
  },
  { timestamps: true }
);

const module = mongoose.model("module", ModuleSchema);
export default module;
