import mongoose from "mongoose";
const Schema = mongoose.Schema;
// creating the actual mongoose schema
const UserSchema = new Schema({
    eventId: {
        type: String,
    },
    img: {
        type: String,
    },
    endDate: {
        type: String,
    },
}, { timestamps: true });
// exporting the type in order to have all the correct linting
const event = mongoose.model("event", UserSchema);
export default event;
//# sourceMappingURL=events.js.map