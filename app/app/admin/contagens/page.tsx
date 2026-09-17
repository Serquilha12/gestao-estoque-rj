import { requireRole } from '@/src/lib/auth';
import { Badge } from '@/src/components/ui/badge';
import { BlindCountsAuditView } from '@/src/components/admin/blind-counts-audit-view';

export default async function AdminContagensPage() {
  await requireRole('ADMINISTRADOR', '/login');

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Módulo de Auditoria</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Controlo de Quebras & Inventário</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Auditoria de Contagens Cegas
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Compare o inventário físico submetido pela equipa com os registos do sistema e homologue desvios.
          </p>
        </div>
      </div>

      {/* Main Audit View */}
      <BlindCountsAuditView />
    </main>
  );
}
