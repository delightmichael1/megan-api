import result from "../models/results.js";
import module from "../models/module.js";
import { handleAddActivity } from "./activity.js";
export const handleAddresult = async (req, res) => {
    try {
        const user = req.user;
        const resultdata = new result(req.body);
        resultdata.userId = user._id;
        await resultdata.save();
        const modulesNumber = await module.countDocuments({ lessonId: req.body.lessonId });
        const userModulesTaken = user.completedModules.filter((moduleId) => moduleId === req.body.moduleId).length;
        let isDone = false;
        if (modulesNumber === userModulesTaken + 1 && resultdata.passed) {
            const activityData = {
                user: user._id,
                type: "completion",
                course: req.body.lessonId,
                icon: "CheckCircle"
            };
            await handleAddActivity(activityData);
            const activityData1 = {
                user: user._id,
                type: "certificate",
                course: req.body.lessonId,
                icon: "UserPlus"
            };
            await handleAddActivity(activityData1);
            user.certificates = [...user.certificates, { lessonId: req.body.lessonId, earnedDate: new Date().toISOString() }];
            isDone = true;
        }
        if (resultdata.passed) {
            user.completedModules = [...user.completedModules, req.body.moduleId];
        }
        await user.save();
        res.status(200).json({ message: "result added successfully.", result: resultdata, isDone });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to create result" });
        console.log(error);
    }
};
export const handleGetresults = async (req, res) => {
    try {
        const moduleId = req.query.id;
        const userId = req.user._id;
        const results = await result.find({ moduleId: moduleId, userId: userId });
        res.status(200).json({ results });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to get results" });
        console.log(error);
    }
};
export const handleGetresult = async (req, res) => {
    try {
        const resultdata = await result.findById(req.params.id);
        res.status(200).json({ result: resultdata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to get result" });
        console.log(error);
    }
};
//# sourceMappingURL=results.js.map