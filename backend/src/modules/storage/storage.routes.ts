import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET } from '../../config/s3.js';
import { loadEnv } from '../../config/env.js';
import { authenticate } from '../../common/auth.js';
import { handleError } from '../../common/errors.js';

const env = loadEnv();

export async function storageRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authenticate);

    // Direct upload (small files only)
    app.post('/upload', async (req, reply) => {
        try {
            const part = await req.file();
            if (!part) return reply.code(400).send({ error: 'NoFile' });
            const ext = part.filename.includes('.') ? part.filename.split('.').pop() : 'bin';
            const key = `uploads/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;
            const buf = await part.toBuffer();
            await s3.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: key,
                Body: buf,
                ContentType: part.mimetype,
            }));
            return { key, url: `${env.S3_PUBLIC_ENDPOINT}/${S3_BUCKET}/${key}`, size: buf.length, mimeType: part.mimetype };
        } catch (err) { return handleError(reply, err); }
    });

    // Presigned URL for client-side uploads
    app.post('/presign', async (req, reply) => {
        try {
            const { filename, contentType } = req.body as { filename: string; contentType: string };
            if (!filename) return reply.code(400).send({ error: 'MissingFilename' });
            const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
            const key = `uploads/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;
            const url = await getSignedUrl(s3, new PutObjectCommand({
                Bucket: S3_BUCKET, Key: key, ContentType: contentType,
            }), { expiresIn: 600 });
            return { uploadUrl: url, key, publicUrl: `${env.S3_PUBLIC_ENDPOINT}/${S3_BUCKET}/${key}` };
        } catch (err) { return handleError(reply, err); }
    });

    // Signed download URL
    app.get('/sign', async (req, reply) => {
        try {
            const { key } = req.query as { key?: string };
            if (!key) return reply.code(400).send({ error: 'MissingKey' });
            const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), { expiresIn: 600 });
            return { url };
        } catch (err) { return handleError(reply, err); }
    });
}
