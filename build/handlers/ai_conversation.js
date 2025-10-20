import axios from "axios";
import jwt from "jsonwebtoken";
export const handleAIConversation = async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user1 = decodedToken._id;
        const rasaResponse = await axios.post(`${process.env.AI_ENDPOINT}/webhooks/rest/webhook`, {
            sender: user1,
            message: req.body.message,
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (rasaResponse.data.length > 0 && rasaResponse.data[0].text) {
            res.status(200).json({ message: rasaResponse.data[0].text });
        }
        else {
            res.status(200).json({ message: "Sorry, I couldn't understand that" });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//# sourceMappingURL=ai_conversation.js.map