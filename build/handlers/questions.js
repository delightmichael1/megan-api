import question from "../models/question.js";
import { handleAddActivity } from "./activity.js";
export const handleAddquestion = async (req, res) => {
    try {
        const questionFound = await question.find({ question: req.body.question, moduleId: req.body.moduleId });
        if (questionFound.length > 0) {
            return res.status(400).json({ message: "question already exist" });
        }
        const questiondata = new question(req.body);
        await questiondata.save();
        res.status(200).json({ message: "question added successfully.", question: questiondata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to create question" });
        console.log(error);
    }
};
export const handleGetquestions = async (req, res) => {
    try {
        const user = req.user;
        const moduleId = req.query.id;
        const activityData1 = {
            user: user._id,
            type: "quiz",
            course: moduleId,
            icon: "UserPlus"
        };
        await handleAddActivity(activityData1);
        const questions = await question.find({ moduleId: moduleId });
        res.status(200).json({ questions });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to get questions" });
        console.log(error);
    }
};
export const handleGetquestion = async (req, res) => {
    try {
        const questiondata = await question.findById(req.params.id);
        res.status(200).json({ question: questiondata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to get question" });
        console.log(error);
    }
};
export const handleDeletequestion = async (req, res) => {
    try {
        const questiondata = await question.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "question deleted successfully.", question: questiondata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to delete question" });
        console.log(error);
    }
};
export const handleUpdatequestion = async (req, res) => {
    try {
        const questiondata = await question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "question updated successfully.", question: questiondata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to update question" });
        console.log(error);
    }
};
//# sourceMappingURL=questions.js.map