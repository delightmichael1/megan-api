import activity from "@/models/activity"

export type IData = {
    user: string, type: "enrollment"| "completion"| "certificate"| "quiz", course:string, icon:  "UserPlus"| "CheckCircle"
}

export async function handleAddActivity(data: IData) {
    try {
        await activity.insertOne(data)
    } catch (error:any) {
        console.log("@@@@@", error)
    }
}