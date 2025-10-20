// middlewares/authMiddleware.js
import user from "@/models/user";
import jwt from "jsonwebtoken";

export async function authMiddleware(req: any, res: any, next: any) {
    console.log(req.url);

    if (req.url.includes("/socket.io")) {
        return next();
    }
    const token = req.headers.authorization?.replace("Bearer ", "");
    const deviceID = req.header("X-Device-Id");
    if (!token || !deviceID) {
        console.log("Token not found");
        return res.status(401).json({ message: "Access denied." });
    }

    try {
        if (req.url === "/user/refresh") {
            console.log("Refresh token");
            return next()
        } else {
            const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const now = Math.floor(Date.now() / 1000);
            if (decodedToken.exp < now) {
                return res.status(401).json({ message: "Access denied." });
            }
            const userdata = await user.findById(decodedToken._id);
            if (!userdata) {
                return res.status(401).json({ message: "Access denied." });
            }
            req.user = userdata;
            next();
        }
    } catch (err) {
        return res.status(401).json({ message: "Invalid token." });
    }
}
