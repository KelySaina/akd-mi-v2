import { instanceOpHandler, setInstanceStatus } from '@/lib/instance-ops';

export const dynamic = 'force-dynamic';

export const POST = instanceOpHandler({
    kind: 'restart',
    args: (slug) => ['restart', slug],
    timeoutMs: 10 * 60 * 1000,
    onSuccess: (slug) => setInstanceStatus(slug, 'RUNNING'),
});
