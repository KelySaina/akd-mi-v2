import { instanceOpHandler, setInstanceStatus } from '@/lib/instance-ops';

export const dynamic = 'force-dynamic';

// POST /api/admin/instances/:slug/up — kicks off `akd-mi up <slug>` as a background
// job and returns the jobId. Poll /api/admin/jobs/:id to follow progress.
export const POST = instanceOpHandler({
    kind: 'up',
    args: (slug) => ['up', slug],
    timeoutMs: 10 * 60 * 1000,
    onSuccess: (slug) => setInstanceStatus(slug, 'RUNNING'),
});
