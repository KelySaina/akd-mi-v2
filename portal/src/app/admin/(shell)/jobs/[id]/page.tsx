'use client';
import Link from 'next/link';
import { use } from 'react';
import { PageHeader, Button } from '@/components/AdminShell';
import { JobRunner } from '@/components/JobRunner';
import { ArrowLeft } from 'lucide-react';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <>
            <PageHeader
                title="Job"
                subtitle={id}
                action={
                    <Link href="/admin/jobs">
                        <Button variant="ghost"><ArrowLeft className="size-4" /> Back to jobs</Button>
                    </Link>
                }
            />
            <div className="p-6">
                <JobRunner jobId={id} />
            </div>
        </>
    );
}
