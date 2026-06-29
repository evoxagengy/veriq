import { Building2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { updateProfileAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getProfileData, mapRoleLabel } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Perfil"
};

export default async function ProfilePage() {
  const session = await requireSession();
  const data = await getProfileData(session.user.id, session.user.tenantId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Perfil</h1>
        <p className="mt-1 text-sm text-ink-muted">Veja e atualize suas informações de conta de forma segura.</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-display text-base font-bold text-primary-dark">Dados pessoais</h2>
              <p className="mt-1 text-sm text-ink-muted">Dados usados internamente para responsabilidade e rastreabilidade.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome *" name="name" defaultValue={data.user.name} icon={UserRound} />
                <Field label="E-mail" name="email" defaultValue={data.user.email} icon={Mail} disabled />
                <Field label="Departamento" name="department" defaultValue={data.user.department ?? ""} icon={Building2} />
                <Field label="Cargo" name="position" defaultValue={data.user.position ?? ""} icon={ShieldCheck} />
                <Field label="Telefone" name="phone" defaultValue={data.user.phone ?? ""} icon={Phone} />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar perfil</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Conta</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Empresa" value={data.user.tenant.name} />
              <Info label="Perfil" value={mapRoleLabel(data.user.role)} />
              <Info label="Último login" value={formatDateTime(data.user.lastLoginAt)} />
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Status</span>
                <Badge variant={data.user.active ? "success" : "neutral"}>{data.user.active ? "Ativo" : "Inativo"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Sessões ativas</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.sessions.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-bold text-primary-dark">Sessão criada em {formatDateTime(item.createdAt)}</p>
                  <p className="mt-1 text-xs text-ink-muted">Expira em {formatDateTime(item.expiresAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-display text-base font-bold text-primary-dark">Minhas ações recentes</h2>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.audits.map((audit) => (
            <div key={audit.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-bold text-primary-dark">{audit.action}</p>
              <p className="mt-1 text-xs text-ink-muted">{audit.resource} • {formatDateTime(audit.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  icon: Icon,
  disabled = false
}: {
  label: string;
  name: string;
  defaultValue: string;
  icon: typeof UserRound;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-disabled" aria-hidden="true" />
        <input
          name={name}
          defaultValue={defaultValue}
          disabled={disabled}
          className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 pl-10 text-sm text-primary focus:border-accent focus:shadow-glow disabled:bg-slate-50"
        />
      </div>
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

