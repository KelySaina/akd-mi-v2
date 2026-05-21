import { instanceOpHandler } from '@/lib/instance-ops';

export const dynamic = 'force-dynamic';

export const POST = instanceOpHandler({
    kind: 'seed',
    args: (slug) => ['seed', slug],
    timeoutMs: 10 * 60 * 1000,
});
