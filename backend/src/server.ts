import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';

import { loadEnv } from './config/env.js';
import { connectDb, disconnectDb } from './config/prisma.js';
import { redis } from './config/redis.js';
import { ensureBucket } from './config/s3.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { institutionRoutes } from './modules/institutions/institution.routes.js';
import { moduleRoutes } from './modules/modules/module.routes.js';
import { courseRoutes } from './modules/courses/course.routes.js';
import { studentRoutes } from './modules/students/student.routes.js';
import { teacherRoutes } from './modules/teachers/teacher.routes.js';
import { enrollmentRoutes } from './modules/enrollments/enrollment.routes.js';
import { gradeRoutes } from './modules/grades/grade.routes.js';
import { storageRoutes } from './modules/storage/storage.routes.js';

export async function buildApp() {
    const env = loadEnv();

    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        },
        trustProxy: true,
    });

    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(cors, {
        origin: [env.PUBLIC_WEB_URL],
        credentials: true,
    });
    await app.register(cookie, { secret: env.SESSION_SECRET });
    await app.register(jwt, {
        secret: env.JWT_SECRET,
        sign: { expiresIn: env.JWT_ACCESS_TTL },
    });
    await app.register(rateLimit, {
        max: 200,
        timeWindow: '1 minute',
        redis: redis as any,
    });
    await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });

    // Health & meta
    app.get('/health', async () => ({
        status: 'ok',
        instance: env.INSTANCE_SLUG,
        name: env.INSTANCE_NAME,
        uptime: process.uptime(),
    }));

    app.get('/meta', async () => ({
        slug: env.INSTANCE_SLUG,
        name: env.INSTANCE_NAME,
        webUrl: env.PUBLIC_WEB_URL,
    }));

    // Routes
    await app.register(authRoutes,        { prefix: '/api/v1/auth' });
    await app.register(userRoutes,        { prefix: '/api/v1/users' });
    await app.register(institutionRoutes, { prefix: '/api/v1/institution' });
    await app.register(moduleRoutes,      { prefix: '/api/v1/modules' });
    await app.register(courseRoutes,      { prefix: '/api/v1/courses' });
    await app.register(studentRoutes,     { prefix: '/api/v1/students' });
    await app.register(teacherRoutes,     { prefix: '/api/v1/teachers' });
    await app.register(enrollmentRoutes,  { prefix: '/api/v1/enrollments' });
    await app.register(gradeRoutes,       { prefix: '/api/v1/grades' });
    await app.register(storageRoutes,     { prefix: '/api/v1/storage' });

    await connectDb();
    try { await ensureBucket(); }
    catch (err) { app.log.warn({ err }, 's3 ensureBucket failed'); }

    app.addHook('onClose', async () => {
        await disconnectDb();
        try { await redis.quit(); } catch { /* ignore */ }
    });

    return app;
}

async function main() {
    const app = await buildApp();
    const env = loadEnv();
    try {
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        app.log.info(`AKD-MI API listening on :${env.PORT} (instance=${env.INSTANCE_SLUG})`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();
