import jwt from "jsonwebtoken";
import user from "../models/user.js";
import { sendMessageToUser } from "../server.js";
import connection from "../models/connection.js";
import { findUserMatches } from "../services/userMatcher.js";
import connectionRequest from "../models/connectionRequest.js";
export const handleGetAllConnections = async (req, res) => {
    try {
        const { page, limit, filter, name } = req.query;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decodedToken._id;
        if (name !== null && name !== "undefined") {
            const connections = await connection.find({ $or: [{ user1: userId }, { user2: userId }] }).skip((page - 1) * limit).limit(parseInt(limit));
            let connectionUsers = [];
            for (var cnt of connections) {
                if (cnt.user1 === userId) {
                    const userdata = await user.findById(cnt.user2);
                    connectionUsers.push(userdata);
                }
                else {
                    const userdata = await user.findById(cnt.user1);
                    connectionUsers.push(userdata);
                }
            }
            const filteredConnectionUsers = connectionUsers.filter((user) => {
                return user.name.toLowerCase().includes(name.toLowerCase());
            });
            return res.status(200).json({ connections: filteredConnectionUsers, message: "Connections successfully retrieved" });
        }
        else if (filter !== null && filter !== "null" && filter !== "undefined" && filter !== "all") {
            const connections = await connection.find({ $or: [{ user1: userId }, { user2: userId }] }).skip((page - 1) * limit).limit(parseInt(limit));
            let connectionUsers = [];
            for (var cnt of connections) {
                if (cnt.user1 === userId) {
                    const userdata = await user.findById(cnt.user2);
                    connectionUsers.push(userdata);
                }
                else {
                    const userdata = await user.findById(cnt.user1);
                    connectionUsers.push(userdata);
                }
            }
            const filteredConnectionUsers = connectionUsers.filter((user) => {
                return user.mentorshipType === filter;
            });
            return res.status(200).json({ connections: filteredConnectionUsers, message: "Connections successfully retrieved" });
        }
        else {
            const connections = await connection.find({ $or: [{ user1: userId }, { user2: userId }] }).skip((page - 1) * limit).limit(parseInt(limit));
            let connectionUsers = [];
            for (var cnt of connections) {
                if (cnt.user1 === userId) {
                    const userdata = await user.findById(cnt.user2);
                    connectionUsers.push(userdata);
                }
                else {
                    const userdata = await user.findById(cnt.user1);
                    connectionUsers.push(userdata);
                }
            }
            return res.status(200).json({ connections: connectionUsers, message: "Connections successfully retrieved" });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error searching connections' });
    }
};
export const handleGetAllUsers = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const filter = req.query.filter || "both";
        const name = req.query.name || null;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (name !== null && name !== "undefined") {
            const users = await user.find({ name: { $regex: name, $options: "i" } });
            return res.status(200).json({ users: users, message: "Users successfully retrieved" });
        }
        let options = {};
        if (filter !== null && filter !== "null") {
            options = {
                limit: parseInt(limit),
                skip: (page - 1) * limit,
                minScore: 0.5,
                mentorshipType: filter
            };
        }
        else {
            options = {
                limit: parseInt(limit),
                skip: (page - 1) * limit,
                minScore: 0.5,
            };
        }
        const users = await findUserMatches(decodedToken._id, options);
        res.status(200).json({ users: users, message: "Users successfully retrieved" });
    }
    catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};
export const handleCreateconnection = async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user1 = decodedToken._id;
        const user2 = req.body._id;
        const userdata = user.findById(user2);
        if (!userdata) {
            res.status(404).json({ message: 'User not found' });
        }
        const connectionRequestFound = await connectionRequest.find({ user1: { $in: [user1, user2] }, user2: { $in: [user1, user2] } });
        if (connectionRequestFound.length > 0) {
            return res.status(400).json({ message: "Connection request already sent" });
        }
        const connectionFound = await connection.find({ user1: { $in: [user1, user2] }, user2: { $in: [user1, user2] } });
        if (connectionFound.length > 0) {
            return res.status(400).json({ message: "Connection already exists" });
        }
        await connectionRequest.create({ user1: user1, user2: user2 });
        sendMessageToUser(user2, "connection:request", user1);
        res.status(200).json({ message: "Connection request sent successfully" });
    }
    catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};
export const handleAcceptConnection = async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user1 = decodedToken._id;
        const user2 = req.body._id;
        const newConnection = { user1: user1, user2: user2 };
        await connection.create(newConnection);
        await connectionRequest.deleteOne(newConnection);
        await user.updateMany({ _id: { $in: [user1, user2] } }, { $inc: { connections: 1 } });
        sendMessageToUser(user2, "connection:accepted", user1);
        res.status(200).json({ message: "Connection request accepted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error accepting connection' });
    }
};
export const handleGetConnectionRequests = async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user2 = decodedToken._id;
        const connections = await connectionRequest.find({ user2: user2 });
        let connectionUsers = [];
        for (var cnt of connections) {
            const userdata = await user.findById(cnt.user2);
            connectionUsers.push(userdata);
        }
        res.status(200).json({ connections: connectionUsers, message: "Connection retrieved successfully" });
    }
    catch (error) {
        console.error('Error getting connections:', error);
        res.status(500).json({ message: 'Error getting connections' });
    }
};
//# sourceMappingURL=connections.js.map