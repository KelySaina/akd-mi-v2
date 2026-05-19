import { z } from 'zod';

export const PaginationQuery = z.object({
    page:  z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q:     z.string().trim().optional(),
});

export type Pagination = z.infer<typeof PaginationQuery>;

export function skipTake(p: Pagination) {
    return { skip: (p.page - 1) * p.limit, take: p.limit };
}
