import lesson from "@/models/lesson";
import module from "@/models/module";
import user from "@/models/user";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { handleAddActivity, IData } from "./activity";

export const handleAddlesson = async (req: any, res: any): Promise<Response | void> => {
    try {
        const lessonFound = await lesson.find({ title: req.body.title, category: req.body.category })
        
        if (lessonFound.length > 0) {
            return res.status(400).json({ message: "lesson already exist" });
        }
        const lessondata = new lesson(req.body);
        await lessondata.save();
        res.status(200).json({ message: "Lesson added successfully.", lesson: lessondata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to create lesson" });
        console.log(error);
    }
};

export const handleGetLessons = async (req: any, res: any): Promise<Response | void> => {
    try {
        const user = req.user
        let lessons: any
        if (user.permissions.includes("admin")) {
            lessons = await lesson.find();
        } else {
            lessons = await lesson.find({ status: "published" });
        }
        for (var lessondata of lessons) {
            const modules = await module.find({ lessonId: lessondata._id });
            (lessondata as any).modules = modules.map(moduledata => ({
                id: moduledata._id.toString(), 
                title: moduledata.title
            }));
        }
        res.status(200).json({ lessons });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to get lessons" });
        console.log(error);
    }
};

export const handleGetLesson = async (req: any, res: any): Promise<Response | void> => {
    try {
        const lessondata = await lesson.findById(req.params.id);
        res.status(200).json({ lesson: lessondata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to get lesson" });
        console.log(error);
    }
};

export const handleDeleteLesson = async (req: any, res: any): Promise<Response | void> => {
    try {
        const lessondata = await lesson.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Lesson deleted successfully.", lesson: lessondata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to delete lesson" });
        console.log(error);
    }
};

export const handleUpdateLesson = async (req: any, res: any): Promise<Response | void> => {
    try {
        const lessondata = await lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "Lesson updated successfully.", lesson: lessondata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to update lesson" });
        console.log(error);
    }
};

export const handlePublishLesson = async (req: any, res: any): Promise<Response | void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid lesson id" });
        }
        const startDate = new Date(req.body.startDate).toLocaleDateString()
        const endDate = new Date(req.body.endDate).toLocaleDateString()
        const lessondata = await lesson.findByIdAndUpdate(id, {...req.body, status: "published"}, { new: true });
        res.status(200).json({ message: "Lesson updated successfully.", lesson: lessondata });

        const users = await user.find();
        for (var userData of users) {
            let transporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.PASSWORD,
                },
            });
            const mailOptions = {
                to: userData.email,
                subject: "POSB",
                html: `<!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>POSB Courses</title>
                            <style>
                                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;  }
                                .container { max-width: 500px; background: #ffffff; padding: 20px; margin: 50px auto; border-radius: 8px; 
                                        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4); text-align: center; border-width: 1px; border-color: rgb(145, 132, 132)}
                                .logo { width: 120px; margin-bottom: 20px; }
                                .otp { font-size: 24px; font-weight: bold; color: #2d89ff; background: #f1f7ff; padding: 10px 20px;
                                display: inline-block; border-radius: 5px; margin: 10px 0; }
                                .footer { font-size: 12px; color: #777; margin-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <img src="https://firebasestorage.googleapis.com/v0/b/test-dashboard-65d9c.appspot.com/o/ZIDA-LOGO-2023-01-1-768x392.png?alt=media&token=b6c07047-6aee-4488-b1a1-d86e4f3cfe81" alt="ZIDA Logo" class="logo">
                                <h2>POSB Courses</h2>
                                <p> Hi @${userData.email}. There is a new lesson scheduled for ${startDate} to ${endDate}. Check your account for more details.</p>
                                <div class="footer">
                                    <p>© 2025 POSB. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>`
            };
            await transporter.sendMail(mailOptions);
        }
    } catch (error: any) {
        res.status(400).json({ message: "Failed to update lesson" });
        console.log(error);
    }
}

export const handleGetupcomingLessons = async (req: any, res: any): Promise<Response | void> => {
    try {
        const lessons = await lesson.find({ status: "published" });
        const upcomingLessons = getUpcomingSessions(lessons);
        res.status(200).json({ lessons: upcomingLessons });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to get lessons" });
        console.log(error);
    }
}

function getUpcomingSessions(lessons: any[]) {
  const now = new Date();
  
  return lessons
    .filter(lesson => {
      const startDate = new Date(lesson.startDate);
      return startDate >= now;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

export const handleEnrolltoLesson = async (req: any, res: any) => {
    try {
        const lessonId = req.body.id;
        const userdata = req.user
        const lessondata = await lesson.findByIdAndUpdate(lessonId, { $inc: { enrollments: 1 } }, { new: true });
        if (!lessondata) {
            res.status(400).json({ message: "Lesson not found" });
            return;
        }
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        const activityData: IData = {
            user: userdata._id,
            type: "enrollment",
            course: lessonId,
            icon: "UserPlus"
        }
        await handleAddActivity(activityData)
        const enrolledLessons = userdata.enrolledLessons || [];
        enrolledLessons.push(lessonId);
        userdata.enrolledLessons = enrolledLessons;
        await userdata.save();
        res.status(200).json({ message: "Enrolled successfully" });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to enroll" });
        console.log(error);
    }
}