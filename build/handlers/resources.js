import jwt from "jsonwebtoken";
import resource from "../models/resource.js";
import { bucket } from "../utils/firebase.js";
import { uploadMulterFile } from "./documentsUpload.js";
import user from "../models/user.js";
export const handleAddResource = async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decodedToken._id;
        let resourceData = req.body;
        const file = req.file;
        const resourceFound = await resource.findOne({ title: resourceData.title, author: resourceData.author, type: resourceData.type });
        if (resourceFound) {
            console.log('Resource already exists', resourceFound);
            return res.status(400).json({ message: 'Resource already exists' });
        }
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const result = await uploadMulterFile(file, "resources");
        resourceData.downloadLink = result.link;
        resourceData.publicLink = result.url;
        resourceData.fileName = result.filePath;
        await resource.create(resourceData);
        await user.findOneAndUpdate({ _id: userId }, { $inc: { posts: 1 } });
        res.status(200).json({ message: 'Resource added successfully' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error adding resource' });
    }
};
export const handleGetResources = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const authorId = req.query.id;
        const name = req.query.name;
        const filter = req.query.filter;
        let option = {};
        if (authorId && authorId !== "undefined") {
            if (filter && filter !== "undefined") {
                option = { author: authorId, type: filter };
            }
            else {
                option = { author: authorId };
            }
            const resources = await resource.find(option).skip((page - 1) * limit);
            return res.status(200).json({ resources, message: "Resources retrieved successfully" });
        }
        if (name && name !== "undefined") {
            if (filter && filter !== "undefined") {
                option = { title: { $regex: name, $options: "i" }, type: filter };
            }
            else {
                option = { title: { $regex: name, $options: "i" } };
            }
            const resources = await resource.find(option).skip((page - 1) * limit);
            return res.status(200).json({ resources, message: "Resources retrieved successfully" });
        }
        if (filter && filter !== "undefined" && filter !== "all") {
            option = { type: filter };
        }
        const resources = await resource.find(option).skip((page - 1) * limit);
        res.status(200).json({ resources: resources, message: "Resources retrieved successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error getting resource' });
    }
};
export const handleDownloadResource = async (req, res) => {
    const { file } = req.params;
    const { id } = req.query;
    const bucketFile = bucket.file(`resources/${file}`);
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    await bucketFile.createReadStream().pipe(res);
    await resource.findOneAndUpdate({ _id: id }, { $inc: { downloads: 1 } });
};
//# sourceMappingURL=resources.js.map