import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PlaceholderPage({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <Card>
        <CardContent className="flex min-h-[460px] flex-col items-center justify-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-cyan-50 text-accent-dark">
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-primary-dark">Módulo preparado</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            A base visual, navegação protegida e arquitetura de segurança já estão prontas para evoluir este módulo com fluxos completos.
          </p>
          <Button className="mt-6" variant="secondary">Ver documentação do módulo</Button>
        </CardContent>
      </Card>
    </div>
  );
}

