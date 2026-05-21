import { AdminShell } from '@/components/AdminShell';
import { DialogsProvider } from '@/components/Dialogs';

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
    return (
        <DialogsProvider>
            <AdminShell>{children}</AdminShell>
        </DialogsProvider>
    );
}
