import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const awsRegion = process.env.AWS_REGION || "us-east-1";

export const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// S3_BUCKET_NAME may contain bucket/path format - split it properly
const fullBucketPath = process.env.S3_BUCKET_NAME || "avatar-practice-lab";
export const bucketName = fullBucketPath.split("/")[0];
export const bucketPrefix = fullBucketPath.includes("/") 
  ? fullBucketPath.substring(fullBucketPath.indexOf("/") + 1).replace(/\/$/, "") 
  : "";

// S3 URL can be in different formats depending on region
// Format 1: https://{bucket}.s3.amazonaws.com/{key} (us-east-1 legacy)
// Format 2: https://{bucket}.s3.{region}.amazonaws.com/{key} (regional)
const s3BaseUrl = awsRegion === "us-east-1" 
  ? `https://${bucketName}.s3.amazonaws.com/`
  : `https://${bucketName}.s3.${awsRegion}.amazonaws.com/`;

export async function uploadFileToS3(
  filePathOrBuffer: string | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  let body: Readable | Buffer;
  
  if (Buffer.isBuffer(filePathOrBuffer)) {
    body = filePathOrBuffer;
  } else if (typeof filePathOrBuffer === 'string') {
    body = fs.createReadStream(filePathOrBuffer);
  } else {
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
  return `${s3BaseUrl}${fullKey}`;
}

export async function uploadAudioFileToS3(
  filePathOrBuffer: string | Buffer,
  key: string,
  contentType?: string
): Promise<{ url: string; fileKey: string }> {
  const mimeType = contentType || "audio/webm";
  const url = await uploadFileToS3(filePathOrBuffer, key, mimeType);
  return { url, fileKey: key };
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const fullKey = bucketPrefix ? `${bucketPrefix}/${key}` : key;
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fullKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export function extractS3KeyFromUrl(url: string): string | null {
  // Handle both regional and legacy URL formats
  const legacyUrl = `https://${bucketName}.s3.amazonaws.com/`;
  const regionalUrl = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/`;
  
  let fullKey: string | null = null;
  
  if (url.startsWith(regionalUrl)) {
    fullKey = url.substring(regionalUrl.length);
  } else if (url.startsWith(legacyUrl)) {
    fullKey = url.substring(legacyUrl.length);
  }
  
  if (fullKey) {
    if (bucketPrefix && fullKey.startsWith(bucketPrefix + "/")) {
      return fullKey.substring(bucketPrefix.length + 1);
    }
    return fullKey;
  }
  return null;
}

export async function getFileFromS3(key: string): Promise<{ body: Readable; contentType: string | undefined }> {
  const fullKey = bucketPrefix ? `${bucketPrefix}/${key}` : key;
  console.log("S3 getFileFromS3 - bucket:", bucketName, "fullKey:", fullKey, "prefix:", bucketPrefix);
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fullKey,
  });
  
  const response = await s3Client.send(command);
  return {
    body: response.Body as Readable,
    contentType: response.ContentType,
  };
}
