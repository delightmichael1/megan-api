import path from "path";
import * as fs from 'fs';
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";
import { bucket } from "../utils/firebase.js";
/**
 * Uploads a file buffer to Firebase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original file name (for extension)
 * @param {string} destFolder - Folder in Firebase storage
 * @returns {Promise<{ url: string, filePath: string }>}
 */
export async function uploadBuffer(buffer, originalName, destFolder = "uploads") {
    const fileName = `${uuidv4()}${path.extname(originalName)}`;
    const destPath = `${destFolder}/${fileName}`;
    const file = bucket.file(destPath);
    const mimeType = mime.lookup(originalName) || "application/octet-stream";
    await file.save(buffer, {
        metadata: {
            contentType: mimeType,
        }
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
    return { url: publicUrl, filePath: destPath };
}
/**
 * Deletes a file from Firebase Storage
 * @param {string} filePath - Path to the file in Firebase storage
 * @returns {Promise<void>}
 */
export async function deleteFile(filePath) {
    const file = bucket.file(filePath);
    await file.delete();
    console.log(`File ${filePath} deleted successfully.`);
}
/**
 * Upload a file from local file system to Google Cloud Storage
 * @param filePath - Local file path to upload
 * @param originalName - Original filename (for extension and MIME type detection)
 * @param destFolder - Destination folder in the bucket
 * @returns Object containing permanent download URL and file path
 */
export async function uploadFile(filePath, originalName, destFolder = "uploads") {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const fileName = `${uuidv4()}${path.extname(originalName)}`;
    const destPath = `${destFolder}/${fileName}`;
    const file = bucket.file(destPath);
    const mimeType = mime.lookup(originalName) || "application/octet-stream";
    try {
        // Upload the file
        await bucket.upload(filePath, {
            destination: destPath,
            metadata: {
                contentType: mimeType,
                metadata: {
                    originalName: originalName,
                    uploadedAt: new Date().toISOString(),
                }
            }
        });
        // Make the file publicly readable
        await file.makePublic();
        // Create permanent download URL with proper headers for download
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
        const downloadUrl = `${publicUrl}?response-content-disposition=attachment%3B%20filename%3D"${encodeURIComponent(originalName)}"`;
        return {
            url: downloadUrl,
            filePath: destPath,
        };
    }
    catch (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error}`);
    }
}
/**
 * Upload a file from Express multer file object
 * @param file - Multer file object from req.file
 * @param destFolder - Destination folder in the bucket
 * @returns Object containing permanent download URL and file path
 */
export async function uploadMulterFile(file, destFolder = "uploads") {
    if (!file) {
        throw new Error('No file provided');
    }
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const destPath = `${destFolder}/${fileName}`;
    const bucketFile = bucket.file(destPath);
    try {
        // Upload buffer to Google Cloud Storage
        await bucketFile.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString(),
                    size: file.size.toString(),
                }
            }
        });
        // Make the file publicly readable
        await bucketFile.makePublic();
        // Create permanent download URL with proper headers for download
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
        const downloadUrl = `${publicUrl}?response-content-disposition=attachment%3B%20filename%3D"${encodeURIComponent(file.originalname)}"`;
        return {
            url: publicUrl,
            link: downloadUrl,
            filePath: destPath
        };
    }
    catch (error) {
        console.error('Error uploading multer file:', error);
        throw new Error(`Failed to upload file: ${error}`);
    }
}
//# sourceMappingURL=documentsUpload.js.map