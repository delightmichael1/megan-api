import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ResultSchema = new Schema(
  {
    userId: String,
    moduleId: String,
    totalQuestions: Number,
      correctAnswers: Number,
      wrongAnswers: Number,
      percentage: Number,
      passed: Number,
      timeTaken: Number,
  },
  { timestamps: true }
);

const result = mongoose.model("result", ResultSchema);
export default result;
