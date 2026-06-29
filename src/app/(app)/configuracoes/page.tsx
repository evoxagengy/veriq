import { Bell, Building2, Database, ShieldCheck } from "lucide-react";
import { updateSettingsAction } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getSettingsData } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Configurações"
};

export default async function SettingsPage() {
  const session = await requireSession();
  const data = await getSettingsData(session.user.tenantId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Configurações</h1>
        <p className="mt-1 text-sm text-ink-muted">Configure tenant, segurança, notificações, auditoria e parâmetros do sistema.</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-display text-base font-bold text-primary-dark">Parâmetros operacionais</h2>
              <p className="mt-1 text-sm text-ink-muted">Essas regras impactam execuções, evidências e notificações.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome da empresa *" name="companyName" defaultValue={data.settings.companyName} icon={Building2} />
                <Field label="Tolerância de atraso (min)" name="inspectionGraceMinutes" type="number" defaultValue={String(data.settings.inspectionGraceMinutes)} icon={ShieldCheck} />
                <Field label="Retenção de dados (dias)" name="dataRetentionDays" type="number" defaultValue={String(data.settings.dataRetentionDays)} icon={Database} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Toggle name="checklistApprovalEnabled" label="Exigir aprovação de checklists críticos" defaultChecked={data.settings.checklistApprovalEnabled} />
                <Toggle name="evidenceRequired" label="Exigir evidência em itens críticos" defaultChecked={data.settings.evidenceRequired} />
                <Toggle name="notifyOverdue" label="Notificar inspeções atrasadas" defaultChecked={data.settings.notifyOverdue} />
                <Toggle name="notifyCriticalFailures" label="Notificar falhas críticas" defaultChecked={data.settings.notifyCriticalFailures} />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Salvar configurações</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Tenant</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Empresa" value={data.tenant.name} />
              <Info label="Slug" value={data.tenant.slug} />
              <Info label="Criado em" value={formatDateTime(data.tenant.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Auditoria</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.auditLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-bold text-primary-dark">{log.action}</p>
                  <p className="mt-1 text-xs text-ink-muted">{log.user} • {log.resource} • {formatDateTime(log.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  icon: Icon
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  icon: typeof Bell;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-disabled" aria-hidden="true" />
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 pl-10 text-sm text-primary focus:border-accent focus:shadow-glow"
        />
      </div>
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
      <span className="text-sm font-semibold text-primary">{label}</span>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5 rounded-sm border-border-strong text-accent focus:ring-accent" />
    </label>
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

