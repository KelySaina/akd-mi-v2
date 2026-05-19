import Redis from 'ioredis';
import { loadEnv } from './env.js';

const env = loadEnv();

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});

redis.on('error', (err) => {
    // Avoid noisy logs during startup retries
    if (!String(err.message).includes('ECONNREFUSED')) {
        console.error('Redis error:', err.message);
    }
});
