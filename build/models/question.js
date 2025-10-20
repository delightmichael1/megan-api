import mongoose from "mongoose";
const Schema = mongoose.Schema;
const QuestionSchema = new Schema({
    question: String,
    options: [String],
    correctAnswer: Number, // Index of correct answer in options array
    explanation: String,
    moduleId: String,
    createdAt: String,
    updatedAt: String,
}, { timestamps: true });
const question = mongoose.model("question", QuestionSchema);
export default question;
//# sourceMappingURL=question.js.map