import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, PlayCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { completeInspectionAction, startInspectionAction } from "@/app/actions/inspections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/auth/session";
import { getInspectionDetailData, mapCriticality, mapInspectionStatus } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Execução de inspeção"
};

export default async function InspectionExecutionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const inspection = await getInspectionDetailData(session.user.tenantId, id);

  if (!inspection) {
    notFound();
  }

  const answersByItem = new Map(inspection.answers.map((answer) => [answer.itemId, answer]));
  const isCompleted = inspection.status === "COMPLETED";
  const canStart = inspection.status === "PENDING" || inspection.status === "SCHEDULED" || inspection.status === "OVERDUE";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/inspecoes" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para inspeções
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">{inspection.template.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {inspection.equipment?.name ?? "Área geral"} • prazo {formatDateTime(inspection.dueAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={mapInspectionStatus(inspection.status)} />
          {inspection.score ? <Badge variant="accent">Score {Number(inspection.score).toFixed(1)}%</Badge> : null}
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-display text-base font-bold text-primary-dark">Itens do checklist</h2>
              <p className="mt-1 text-sm text-ink-muted">Responda todos os itens obrigatórios antes de concluir.</p>
            </div>
            {canStart ? (
              <form action={startInspectionAction}>
                <input type="hidden" name="inspectionId" value={inspection.id} />
                <Button type="submit" variant="secondary">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Iniciar
                </Button>
              </form>
            ) : null}
          </CardHeader>
          <CardContent>
            <form action={completeInspectionAction} className="space-y-4">
              <input type="hidden" name="inspectionId" value={inspection.id} />
              {inspection.template.items.map((item) => {
                const answer = answersByItem.get(item.id);
                return (
                  <div key={item.id} className="rounded-lg border border-border bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-cyan-50 text-sm font-bold text-accent-dark">
                          {item.position}
                        </span>
                        <div>
                          <p className="font-semibold text-primary-dark">{item.description}</p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {item.responseType} • criticidade {mapCriticality(item.criticality)}
                            {item.required ? " • obrigatório" : ""}
                          </p>
                        </div>
                      </div>
                      {answer ? (
                        <Badge variant={answer.compliant ? "success" : "danger"}>
                          {answer.compliant ? "Conforme" : "Não conforme"}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                      <input
                        name={`answer_${item.id}`}
                        defaultValue={answer?.value ?? ""}
                        disabled={isCompleted}
                        required={item.required}
                        placeholder="Resposta / medição / evidência"
                        className="veriq-focus h-11 rounded-md border border-border-strong bg-white px-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow disabled:bg-slate-50"
                      />
                      <select
                        name={`compliant_${item.id}`}
                        defaultValue={answer?.compliant === false ? "false" : "true"}
                        disabled={isCompleted}
                        className="veriq-focus h-11 rounded-md border border-border-strong bg-white px-3 text-sm font-semibold text-primary focus:border-accent focus:shadow-glow disabled:bg-slate-50"
                      >
                        <option value="true">Conforme</option>
                        <option value="false">Não conforme</option>
                      </select>
                    </div>
                    <textarea
                      name={`note_${item.id}`}
                      defaultValue={answer?.note ?? ""}
                      disabled={isCompleted}
                      placeholder="Observações do item"
                      className="veriq-focus mt-3 min-h-20 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow disabled:bg-slate-50"
                    />
                  </div>
                );
              })}

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-primary">Observações gerais</span>
                <textarea
                  name="notes"
                  defaultValue={inspection.notes ?? ""}
                  disabled={isCompleted}
                  className="veriq-focus min-h-24 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow disabled:bg-slate-50"
                  placeholder="Resumo da inspeção, evidências e contexto operacional."
                />
              </label>

              {!isCompleted ? (
                <div className="flex justify-end gap-3">
                  <Button type="submit">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Concluir inspeção
                  </Button>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Resumo</h2>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Info label="Checklist" value={inspection.template.code} />
              <Info label="Equipamento" value={inspection.equipment?.tag ?? "Geral"} />
              <Info label="Responsável" value={inspection.assignedTo?.name ?? "Livre"} />
              <Info label="Iniciada em" value={formatDateTime(inspection.startedAt)} />
              <Info label="Concluída em" value={formatDateTime(inspection.completedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Não conformidades</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {inspection.nonConformities.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhuma não conformidade vinculada.</p>
              ) : (
                inspection.nonConformities.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-primary-dark">
                      <TriangleAlert className="h-4 w-4 text-danger" aria-hidden="true" />
                      {item.code}
                    </p>
                    <p className="mt-1 text-sm text-primary">{item.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">Responsável: {item.assignedTo?.name ?? "Sem responsável"}</p>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-primary-dark">{value}</span>
    </div>
  );
}
