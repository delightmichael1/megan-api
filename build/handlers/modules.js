import module from "../models/module.js";
export const handleAddmodule = async (req, res) => {
    try {
        const moduleFound = await module.find({ title: req.body.title, content: req.body.content });
        if (moduleFound.length > 0) {
            return res.status(400).json({ message: "module already exist" });
        }
        const moduledata = new module(req.body);
        await moduledata.save();
        res.status(200).json({ message: "module added successfully.", module: moduledata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to create module" });
        console.log(error);
    }
};
export const handleGetmodules = async (req, res) => {
    try {
        const lessonId = req.query.id;
        const modules = await module.find({ lessonId: lessonId });
        res.status(200).json({ modules });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to get modules" });
        console.log(error);
    }
};
export const handleGetmodule = async (req, res) => {
    try {
        const moduledata = await module.findById(req.params.id);
        res.status(200).json({ module: moduledata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to get module" });
        console.log(error);
    }
};
export const handleDeletemodule = async (req, res) => {
    try {
        const moduledata = await module.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "module deleted successfully.", module: moduledata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to delete module" });
        console.log(error);
    }
};
export const handleUpdatemodule = async (req, res) => {
    try {
        const moduledata = await module.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "module updated successfully.", module: moduledata });
    }
    catch (error) {
        res.status(400).json({ message: "Failed to update module" });
        console.log(error);
    }
};
//# sourceMappingURL=modules.js.map