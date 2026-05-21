import { prisma } from './prisma';

// Seed list used when the Category table is empty. Codes are stable identifiers,
// labels are human-friendly strings shown in selects.
const DEFAULTS = [
    { code: 'SCHOOL',            label: 'School',                sortOrder: 10 },
    { code: 'COLLEGE',           label: 'College',               sortOrder: 20 },
    { code: 'HIGH_SCHOOL',       label: 'High school',           sortOrder: 30 },
    { code: 'UNIVERSITY',        label: 'University',            sortOrder: 40 },
    { code: 'TRAINING_CENTER',   label: 'Training center',       sortOrder: 50 },
    { code: 'VOCATIONAL',        label: 'Vocational institute',  sortOrder: 60 },
    { code: 'KINDERGARTEN',      label: 'Kindergarten',          sortOrder: 70 },
    { code: 'OTHER',             label: 'Other',                 sortOrder: 99 },
];

/** Ensure the Category table has the default rows. Idempotent. */
export async function ensureDefaultCategories() {
    const n = await prisma.category.count();
    if (n > 0) return;
    await prisma.category.createMany({
        data: DEFAULTS.map((d) => ({ ...d, isActive: true })),
        skipDuplicates: true,
    });
}

export async function listActiveCategories() {
    await ensureDefaultCategories();
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
}
