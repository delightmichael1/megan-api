import multer from "multer";
import mongoose from "mongoose";

export const initializeDatabaseConnection = () => {
    mongoose
        .connect(process.env.MONGODB_URI + "/"+ process.env.MONGODB_NAME)
        .then(() => {
            console.log("Database connected");
        })
        .catch((error) => {
            console.log(error);
            process.exit();
        });
};

export const upload = multer({ storage: multer.memoryStorage() });
