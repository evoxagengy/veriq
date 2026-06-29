import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarCheck2, Factory, ShieldAlert, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getEquipmentDetailData, mapCriticality, mapCriticalityBadge, mapEquipmentStatus, mapInspectionStatus, mapNonConformityStatus } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Detalhe do equipamento"
};

export default async function EquipmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const equipment = await getEquipmentDetailData(session.user.tenantId, id);

  if (!equipment) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/equipamentos" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para equipamentos
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">{equipment.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{equipment.tag} • {equipment.category} • {equipment.area}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={mapCriticalityBadge(equipment.criticality)}>{mapCriticality(equipment.criticality)}</Badge>
          <StatusBadge status={mapEquipmentStatus(equipment.status)} />
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-4">
        <Summary icon={Factory} label="Área" value={equipment.area} />
        <Summary icon={Wrench} label="Modelo" value={equipment.model ?? "N/I"} />
        <Summary icon={CalendarCheck2} label="Próxima inspeção" value={formatDateTime(equipment.nextInspectionAt)} />
        <Summary icon={ShieldAlert} label="Não conformidades" value={String(equipment.nonConformities.filter((item) => item.status !== "RESOLVED").length)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Histórico de inspeções</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipment.inspections.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhuma inspeção vinculada.</p>
            ) : (
              equipment.inspections.map((inspection) => (
                <Link key={inspection.id} href={`/inspecoes/${inspection.id}`} className="grid gap-3 rounded-md border border-border p-4 hover:bg-slate-50 md:grid-cols-[1fr_160px_140px]">
                  <div>
                    <p className="font-bold text-primary-dark">{inspection.template.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">Responsável: {inspection.assignedTo?.name ?? "Livre"}</p>
                  </div>
                  <span className="text-sm text-primary">{formatDateTime(inspection.dueAt)}</span>
                  <StatusBadge status={mapInspectionStatus(inspection.status)} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Dados do ativo</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Fabricante" value={equipment.manufacturer ?? "Não informado"} />
              <Info label="Série" value={equipment.serialNumber ?? "Não informado"} />
              <Info label="Localização" value={equipment.location ?? "Não informado"} />
              <Info label="Responsável" value={equipment.responsible?.name ?? "Sem responsável"} />
              <Info label="Ativo" value={equipment.active ? "Sim" : "Não"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Não conformidades</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipment.nonConformities.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhum desvio vinculado.</p>
              ) : (
                equipment.nonConformities.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-bold text-primary-dark">{item.code} • {item.title}</p>
                    <div className="mt-2"><StatusBadge status={mapNonConformityStatus(item.status)} /></div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof Factory; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-50 text-accent-dark">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-muted">{label}</p>
        <p className="mt-1 truncate font-display text-lg font-bold text-primary-dark">{value}</p>
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

