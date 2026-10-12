import {S3Client, PutObjectCommand, GetObjectCommand} from '@aws-sdk/client-s3';

const configKeys = [
  'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_PUBLIC_BUCKET', 'R2_PRIVATE_BUCKET'
];
const provided = configKeys.filter(k => Boolean(process.env[k]));
if (provided.length && provided.length !== configKeys.length) {
  throw new Error('Incomplete R2 configuration: configure all five R2_* variables or none.');
}
export const r2Enabled = provided.length === configKeys.length;
const endpoint = process.env.R2_ENDPOINT;
if (r2Enabled && (!/^https:\/\/[a-z0-9.-]+\.r2\.cloudflarestorage\.com\/?$/i.test(endpoint))) {
  throw new Error('R2_ENDPOINT must be the Cloudflare R2 S3 account endpoint.');
}
const client = r2Enabled ? new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: endpoint.replace(/\/$/,''),
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  },
  maxAttempts: 2
}) : null;

export function publicKeyValid(key) {
  return typeof key === 'string' && key.length < 500 &&
    /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.(?:png|jpg|jpeg|webp|pdf|mp4|webm)$/.test(key) &&
    !key.includes('..');
}

export async function putR2(kind, key, bytes, contentType) {
  if (!r2Enabled) throw new Error('R2 is not configured');
  const Bucket = kind === 'private' ? process.env.R2_PRIVATE_BUCKET : process.env.R2_PUBLIC_BUCKET;
  await client.send(new PutObjectCommand({
    Bucket, Key: key, Body: bytes, ContentType: contentType,
    ContentLength: bytes.length,
    CacheControl: kind === 'public' ? 'public,max-age=604800,immutable' : 'private,no-store'
  }));
}

export async function getR2(kind, key, range) {
  if (!r2Enabled) throw new Error('R2 is not configured');
  const Bucket = kind === 'private' ? process.env.R2_PRIVATE_BUCKET : process.env.R2_PUBLIC_BUCKET;
  try {
    return await client.send(new GetObjectCommand({Bucket,Key:key,...(range?{Range:range}:{})}));
  } catch (e) {
    if (e?.name === 'NoSuchKey' || e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404) return null;
    if (e?.$metadata?.httpStatusCode === 416) {
      const error = new Error('Requested byte range is invalid');
      error.statusCode = 416;
      throw error;
    }
    throw e;
  }
}
