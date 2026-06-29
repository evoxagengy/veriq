import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Clock3, ListChecks, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/auth/session";
import { getChecklistDetailData, mapChecklistStatus, mapCriticality, mapInspectionStatus } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Detalhe do checklist"
};

export default async function ChecklistDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const checklist = await getChecklistDetailData(session.user.tenantId, id);

  if (!checklist) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/checklists" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para checklists
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">{checklist.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{checklist.code} • {checklist.category} • {checklist.area}</p>
        </div>
        <StatusBadge status={mapChecklistStatus(checklist.status)} />
      </div>

      <section className="grid gap-5 md:grid-cols-4">
        <Summary icon={ListChecks} label="Itens" value={String(checklist.items.length)} />
        <Summary icon={Clock3} label="Tempo estimado" value={`${checklist.estimatedMinutes} min`} />
        <Summary icon={ShieldCheck} label="Aprovação" value={checklist.requiresApproval ? "Obrigatória" : "Não requerida"} />
        <Summary icon={ClipboardCheck} label="Execuções" value={String(checklist.inspections.length)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Itens do checklist</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.items.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[48px_1fr_160px_120px]">
                <span className="grid h-9 w-9 place-items-center rounded-sm bg-cyan-50 text-sm font-bold text-accent-dark">{item.position}</span>
                <div>
                  <p className="font-semibold text-primary-dark">{item.description}</p>
                  <p className="mt-1 text-xs text-ink-muted">{item.required ? "Obrigatório" : "Opcional"} • ação: {item.nonConformityAction}</p>
                </div>
                <span className="text-sm font-medium text-primary">{item.responseType}</span>
                <span className="text-sm font-medium text-primary">{mapCriticality(item.criticality)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Informações</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Responsável" value={checklist.responsible?.name ?? "Sem responsável"} />
              <Info label="Periodicidade" value={checklist.periodicity} />
              <Info label="Mobile" value={checklist.mobileEnabled ? "Permitido" : "Bloqueado"} />
              <Info label="Fotos" value={checklist.allowsPhotos ? "Permitidas" : "Não permitidas"} />
              <Info label="Assinatura" value={checklist.requiresSignature ? "Obrigatória" : "Opcional"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Últimas execuções</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.inspections.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhuma execução agendada.</p>
              ) : (
                checklist.inspections.map((inspection) => (
                  <Link key={inspection.id} href={`/inspecoes/${inspection.id}`} className="block rounded-md border border-border p-3 hover:bg-slate-50">
                    <p className="text-sm font-bold text-primary-dark">{inspection.equipment?.tag ?? "GERAL"} • {formatDateTime(inspection.dueAt)}</p>
                    <div className="mt-2"><StatusBadge status={mapInspectionStatus(inspection.status)} /></div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof ListChecks; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-50 text-accent-dark">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-semibold text-ink-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-primary-dark">{value}</p>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-primary-dark">{value}</span>
    </div>
  );
}
