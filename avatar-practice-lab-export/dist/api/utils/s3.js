import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
export const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
// S3_BUCKET_NAME may contain bucket/path format - split it properly
const fullBucketPath = process.env.S3_BUCKET_NAME || "avatar-practice-lab";
const bucketName = fullBucketPath.split("/")[0];
const bucketPrefix = fullBucketPath.includes("/")
    ? fullBucketPath.substring(fullBucketPath.indexOf("/") + 1).replace(/\/$/, "")
    : "";
export async function uploadFileToS3(filePathOrBuffer, key, contentType) {
    let body;
    if (Buffer.isBuffer(filePathOrBuffer)) {
        body = filePathOrBuffer;
    }
    else if (typeof filePathOrBuffer === 'string') {
        body = fs.createReadStream(filePathOrBuffer);
    }
    else {
        throw new Error('Invalid input: expected file path string or Buffer');
    }
    // Prepend bucket prefix to key if it exists (from S3_BUCKET_NAME like "bucket/path/")
    const fullKey = bucketPrefix ? `${bucketPrefix}/${key}` : key;
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: bucketName,
            Key: fullKey,
            Body: body,
            ContentType: contentType || "application/octet-stream",
        },
    });
    await upload.done();
    return `https://${bucketName}.s3.amazonaws.com/${fullKey}`;
}
export async function uploadAudioFileToS3(filePathOrBuffer, key, contentType) {
    const mimeType = contentType || "audio/webm";
    const url = await uploadFileToS3(filePathOrBuffer, key, mimeType);
    return { url, fileKey: key };
}
