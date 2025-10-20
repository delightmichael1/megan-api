import { MongoClient } from "mongodb";
import fs from "fs";
import archiver from "archiver";
import { uploadBuffer } from "./documentsUpload";
import backup from "@/models/backup";

// Utility: zip a folder
function zipFolder(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Backup function using Node.js MongoDB driver
export async function backupMongoDBRemote(mongoUri: string, dbName: string) {
  const client = new MongoClient(mongoUri);
  const dumpDir = `mongo-dump-${Date.now()}`;

  try {
    await client.connect();
    const db = client.db(dbName);

    if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);

    const collections = await db.collections();

    // Dump each collection as JSON
    for (const col of collections) {
      const data = await col.find().toArray();
      fs.writeFileSync(
        `${dumpDir}/${col.collectionName}.json`,
        JSON.stringify(data, null, 2)
      );
    }

    // Zip folder
    const zipFile = `backup-${Date.now()}.zip`;
    await zipFolder(dumpDir, zipFile);

    // Upload zip
    const fileBuffer = fs.readFileSync(zipFile);
    const { url, filePath } = await uploadBuffer(fileBuffer, zipFile, "backups");
    await backup.insertOne({ url, filePath, createdAt: new Date(), size: fileBuffer.buffer.byteLength });

    console.log("✅ MongoDB backup uploaded:", zipFile);

    // Cleanup
    fs.rmSync(dumpDir, { recursive: true, force: true });
    fs.unlinkSync(zipFile);
  } catch (error) {
    console.error("❌ Backup failed:", error);
  } finally {
    await client.close();
  }
}

// Optional: list backups endpoint
export async function handleGetBackups(req: any, res: any) {
  try {
    const backups = await backup.find();
    res.status(200).json({ backups });
  } catch (error: any) {
    res.status(400).json({ message: "Failed to get backups" });
    console.log(error);
  }
}
