import { instanceOpHandler, setInstanceStatus } from '@/lib/instance-ops';

export const dynamic = 'force-dynamic';

// POST /api/admin/instances/:slug/down — async `akd-mi down <slug>` job.
export const POST = instanceOpHandler({
    kind: 'down',
    args: (slug) => ['down', slug],
    timeoutMs: 5 * 60 * 1000,
    onSuccess: (slug) => setInstanceStatus(slug, 'STOPPED'),
});
