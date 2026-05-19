import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { loadEnv } from './env.js';

const env = loadEnv();

export const s3 = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
});

export const S3_BUCKET = env.S3_BUCKET;

/**
 * Ensure the bucket exists and has a public-read policy on `uploads/*`.
 * Safe to call on every boot — operations are idempotent.
 */
export async function ensureBucket() {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    } catch {
        try { await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET })); }
        catch (err: any) {
            // 409 BucketAlreadyOwnedByYou is fine
            if (!String(err?.name ?? '').includes('Already')) {
                console.warn('[s3] createBucket failed:', err?.message ?? err);
            }
        }
    }

    const policy = {
        Version: '2012-10-17',
        Statement: [{
            Sid: 'PublicReadUploads',
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${S3_BUCKET}/uploads/*`],
        }],
    };
    try {
        await s3.send(new PutBucketPolicyCommand({ Bucket: S3_BUCKET, Policy: JSON.stringify(policy) }));
    } catch (err: any) {
        console.warn('[s3] putBucketPolicy failed:', err?.message ?? err);
    }
}
