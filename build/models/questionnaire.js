import mongoose from "mongoose";
const Schema = mongoose.Schema;
// creating the actual mongoose schema
const UserSchema = new Schema({
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    gender: {
        type: String,
    },
    age: {
        type: String,
    },
    nationality: {
        type: String,
    },
    profession: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    relative: {
        type: String,
    },
    relPhone: {
        type: String,
    },
    relEmail: {
        type: String,
    },
    hasSickness: {
        type: String,
    },
    natureOfProblem: {
        type: String,
    },
    timeFrame: {
        type: String,
    },
    medications: {
        type: String,
    },
    effects: {
        type: String,
    },
    hospitalized: {
        type: String,
    },
    hasHIV: {
        type: String,
    },
    usingBarace: {
        type: String,
    },
    usesWalkingAid: {
        type: String,
    },
    usesMedicalDevice: {
        type: String,
    },
    isLimping: {
        type: String,
    },
    stillDoesDailyActivities: {
        type: String,
    },
    canClimbStairs: {
        type: String,
    },
    experiencingBodyWeakness: {
        type: String,
    },
    hadSurgery: {
        type: String,
    },
    swollenBodyPart: {
        type: String,
    },
    openWound: {
        type: String,
    },
    specialDiet: {
        type: String,
    },
    otherSickness: {
        type: String,
    },
    comingAlone: {
        type: String,
    },
    howYouKnowProphet: {
        type: String,
    },
    comments: {
        type: String,
    },
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const questionnaire = mongoose.model('questionnaire', UserSchema);
export default questionnaire;
//# sourceMappingURL=questionnaire.js.map