import mongoose from "mongoose";
const Schema = mongoose.Schema;
// creating the actual mongoose schema
const UserSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    message: {
        type: String,
    },
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const prayerrequest = mongoose.model("prayerrequest", UserSchema);
export default prayerrequest;
//# sourceMappingURL=prayer.request.js.map