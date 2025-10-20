import mongoose from "mongoose";
const Schema = mongoose.Schema;
// creating the actual mongoose schema
const UserSchema = new Schema({
    name: {
        type: String,
    },
    surname: {
        type: String,
    },
    gender: {
        type: String,
    },
    dob: {
        type: String,
    },
    nationality: {
        type: String,
    },
    address: {
        type: String,
    },
    phone: {
        type: String,
    },
    partnership: {
        type: String,
    },
    email: {
        type: String,
    },
    city: {
        type: String,
    },
    kingdomDriver: {
        type: Boolean,
    },
    residence: {
        type: String,
    },
    ptnNumber: {
        type: Number,
    },
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const partner = mongoose.model("partner", UserSchema);
export default partner;
//# sourceMappingURL=partners.js.map