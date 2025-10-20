import certification from "@/models/certification";

export const handleAddcertification = async (req: any, res: any): Promise<Response | void> => {
    try {
        const certificationFound = await certification.find({ title: req.body.title, courseId: req.body.courseId })
        
        if (certificationFound.length > 0) {
            return res.status(400).json({ message: "certification already exist" });
        }
        const certificationdata = new certification(req.body);
        await certificationdata.save();
        res.status(200).json({ message: "certification added successfully.", certification: certificationdata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to create certification" });
        console.log(error);
    }
};

export const handleGetcertifications = async (req: any, res: any): Promise<Response | void> => {
    try {
        const lessonId = req.query.id
        const certifications = await certification.find({ courseId: lessonId });
        res.status(200).json({ certifications });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to get certifications" });
        console.log(error);
    }
};

export const handleGetcertification = async (req: any, res: any): Promise<Response | void> => {
    try {
        const certificationdata = await certification.findById(req.params.id);
        res.status(200).json({ certification: certificationdata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to get certification" });
        console.log(error);
    }
};

export const handleDeletecertification = async (req: any, res: any): Promise<Response | void> => {
    try {
        const certificationdata = await certification.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "certification deleted successfully.", certification: certificationdata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to delete certification" });
        console.log(error);
    }
};

export const handleUpdatecertification = async (req: any, res: any): Promise<Response | void> => {
    try {
        const certificationdata = await certification.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "certification updated successfully.", certification: certificationdata });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to update certification" });
        console.log(error);
    }
};

export const handleGetUserCerts = async (req: any, res: any): Promise<Response | void> => { 
    try {
        const userCerts = req.user.certificates
        let certificationData = []
        for (const cert of userCerts) {
            const certData = await certification.findOne({ courseId: cert.lessonId })
            console.log(certData)
            if (certData) {
                const data = {
                    ...certData.toJSON(),
                    earnedDate: cert.earnedDate
                }
                certificationData.push(data)
            }
        }
        res.status(200).json({ message: "certification fetched successfully.", certifications: certificationData });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to get certifications" });
        console.log(error);
    }
}