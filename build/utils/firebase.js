import admin from "firebase-admin";
import { readFileSync } from "fs";
admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(readFileSync("./serviceKey.json", "utf8"))),
    storageBucket: "test-dashboard-65d9c.appspot.com"
});
const bucket = admin.storage().bucket();
console.log("Firebase initialized", bucket.name);
export { bucket };
//# sourceMappingURL=firebase.js.map