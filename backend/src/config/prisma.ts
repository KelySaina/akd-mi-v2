import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: process.env.LOG_LEVEL === 'debug' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});

export async function connectDb() {
    const maxAttempts = 30;
    let lastErr: unknown;
    for (let i = 1; i <= maxAttempts; i++) {
        try {
            await prisma.$connect();
            await prisma.$queryRaw`SELECT 1`;
            return;
        } catch (err) {
            lastErr = err;
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    throw lastErr;
}

export async function disconnectDb() {
    await prisma.$disconnect();
}
