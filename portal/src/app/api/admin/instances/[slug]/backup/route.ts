import { instanceOpHandler } from '@/lib/instance-ops';

export const dynamic = 'force-dynamic';

export const POST = instanceOpHandler({
    kind: 'backup',
    args: (slug) => ['backup', slug],
    timeoutMs: 30 * 60 * 1000,
});
