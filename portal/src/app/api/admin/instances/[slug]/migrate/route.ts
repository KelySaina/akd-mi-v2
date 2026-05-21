import { instanceOpHandler } from '@/lib/instance-ops';

export const dynamic = 'force-dynamic';

export const POST = instanceOpHandler({
    kind: 'migrate',
    args: (slug) => ['migrate', slug],
    timeoutMs: 10 * 60 * 1000,
});
