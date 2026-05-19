// Seed the initial admin user + institution from env vars.
// Idempotent: safe to run multiple times.
import { prisma, connectDb, disconnectDb } from '../config/prisma.js';
import { loadEnv } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.service.js';

async function main() {
    const env = loadEnv();
    await connectDb();

    // 1. Ensure institution
    let institution = await prisma.institution.findFirst();
    if (!institution) {
        institution = await prisma.institution.create({
            data: {
                name: env.INSTANCE_NAME,
                slug: env.INSTANCE_SLUG,
            },
        });
        console.log(`✓ Created institution: ${institution.name} (${institution.slug})`);
    } else {
        console.log(`• Institution already exists: ${institution.name}`);
    }

    // 2. Ensure initial admin
    const existing = await prisma.user.findUnique({ where: { email: env.ADMIN_EMAIL } });
    if (!existing) {
        const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
        const user = await prisma.user.create({
            data: {
                email: env.ADMIN_EMAIL,
                name: env.ADMIN_NAME,
                role: 'INSTANCE_ADMIN',
                emailVerified: true,
                passwordHash,
            },
        });
        console.log(`✓ Created instance admin: ${user.email}`);
    } else {
        console.log(`• Admin user already exists: ${existing.email}`);
    }

    // 3. Enable all default modules
    const defaults = ['courses', 'students', 'teachers', 'grades', 'schedule'];
    for (const moduleKey of defaults) {
        await prisma.institutionModule.upsert({
            where: { institutionId_moduleKey: { institutionId: institution.id, moduleKey } },
            update: {},
            create: { institutionId: institution.id, moduleKey, enabled: true },
        });
    }
    console.log(`✓ Default modules enabled: ${defaults.join(', ')}`);

    await disconnectDb();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
