import Image from "next/image";
import { ClipboardCheck, Clock3, ListChecks, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

const features = [
  {
    icon: ClipboardCheck,
    title: "Checklist de equipamentos",
    text: "Padronize inspeções e mantenha equipamentos sempre conformes."
  },
  {
    icon: ListChecks,
    title: "Inspeções operacionais",
    text: "Execute rotinas com agilidade e registre evidências em tempo real."
  },
  {
    icon: Clock3,
    title: "Histórico e rastreabilidade",
    text: "Acompanhe execuções com controle total de auditoria."
  },
  {
    icon: ShieldCheck,
    title: "Conformidade e execução",
    text: "Garanta aderência a normas, políticas e processos críticos."
  }
];

export const metadata = {
  title: "Entrar"
};

export default function LoginPage() {
  return (
    <main className="h-screen overflow-hidden bg-white">
      <div className="grid h-screen lg:grid-cols-[1fr_1fr]">
        <section className="login-grid relative hidden overflow-hidden px-14 py-10 text-white lg:block">
          <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col justify-center">
            <Image src="/brand/logo-text.png" alt="Veriq" width={230} height={64} priority className="h-auto w-56" />
            <h1 className="mt-10 max-w-2xl font-display text-[42px] font-bold leading-tight tracking-normal">
              Checklists operacionais com mais <span className="text-accent">controle</span> e{" "}
              <span className="text-accent">agilidade</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-7 text-slate-200">
              Simplifique checklists de equipamentos e rotinas operacionais, garanta conformidade
              e tenha total visibilidade da execução em tempo real.
            </p>

            <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-lg border border-white/12 bg-white/[0.05] p-4 shadow-soft">
                    <div className="flex gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white/10 text-accent">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">{feature.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{feature.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 max-w-4xl rounded-xl border border-white/16 bg-primary-dark/78 p-4 shadow-2xl">
              <div className="grid grid-cols-[82px_1fr] overflow-hidden rounded-lg border border-white/10 bg-[#061B35]">
                <div className="border-r border-white/10 p-4">
                  <Image src="/brand/logo.png" alt="" width={30} height={30} />
                  <div className="mt-7 space-y-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                        <span className={item === 3 ? "h-3 w-14 rounded-full bg-accent" : "h-2 w-11 rounded-full bg-slate-600"} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-white">Visão geral</p>
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {["1.248", "24", "320", "98,6%"].map((value, index) => (
                      <div key={value} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                        <p className="text-[10px] leading-4 text-slate-400">
                          {["Checklists concluídos", "Não conformidades", "Equipamentos", "Taxa de conformidade"][index]}
                        </p>
                        <p className="mt-2 font-display text-xl font-bold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                      <p className="text-xs font-semibold text-white">Execuções recentes</p>
                      <div className="mt-3 space-y-2">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-primary-dark">✓</span>
                            <span className="h-2 w-24 rounded-full bg-slate-600" />
                            <span className="h-2 w-16 rounded-full bg-slate-700" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                      <p className="text-xs font-semibold text-white">Conformidade por período</p>
                      <svg className="mt-2 h-20 w-full" viewBox="0 0 260 90" aria-hidden="true">
                        <path d="M4 70 C32 70 28 20 58 28 S91 76 117 50 140 18 162 40 183 72 206 34 230 18 256 22" fill="none" stroke="#00D6C9" strokeWidth="3" />
                        <path d="M4 70 C32 70 28 20 58 28 S91 76 117 50 140 18 162 40 183 72 206 34 230 18 256 22 V90 H4 Z" fill="url(#loginChart)" opacity=".32" />
                        <defs>
                          <linearGradient id="loginChart" x1="0" x2="0" y1="0" y2="1">
                            <stop stopColor="#00D6C9" />
                            <stop offset="1" stopColor="#00D6C9" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="login-mesh absolute inset-x-0 bottom-0 h-[28rem]" />
        </section>

        <section className="relative flex h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_100%_50%,rgba(226,232,240,.75),transparent_25rem)] px-5">
          <Image className="absolute right-16 top-14 hidden lg:block" src="/brand/logo.png" alt="" width={54} height={54} />
          <div className="w-full max-w-[520px] rounded-lg border border-border bg-white/92 p-7 shadow-card backdrop-blur md:p-9">
            <div className="mb-7 text-center">
              <h2 className="font-display text-3xl font-bold text-primary-dark">Entrar no Veriq</h2>
              <p className="mt-2 text-base text-ink-muted">Acesse sua conta para continuar</p>
            </div>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
