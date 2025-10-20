import activity from "../models/activity.js";
export async function handleAddActivity(data) {
    try {
        await activity.insertOne(data);
    }
    catch (error) {
        console.log("@@@@@", error);
    }
}
//# sourceMappingURL=activity.js.map