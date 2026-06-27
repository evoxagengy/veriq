"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Headphones, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {
  ok: false
};

function SubmitButton() {
  return (
    <Button type="submit" className="mt-2 h-12 w-full">
      Entrar
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-primary-dark">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          icon={<Mail className="h-5 w-5" />}
          required
          disabled={pending}
          className="h-14"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-primary-dark">
          Senha
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Sua senha"
            icon={<Lock className="h-5 w-5" />}
            required
            disabled={pending}
            className="h-14 pr-12"
          />
          <button
            type="button"
            className="veriq-focus absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-sm text-ink-disabled hover:text-primary"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            disabled={pending}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="remember"
            className="h-5 w-5 rounded-sm border-border-strong text-accent focus:ring-accent"
            disabled={pending}
          />
          Lembrar de mim
        </label>
        <a className="text-sm font-semibold text-accent-dark hover:text-accent" href="mailto:suporte@veriq.local">
          Esqueci minha senha
        </a>
      </div>

      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />

      <div className="flex items-center gap-4 text-sm text-ink-muted">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="secondary" className="h-12 w-full" disabled={pending}>
        <Headphones className="h-5 w-5" aria-hidden="true" />
        Falar com suporte
      </Button>

      <p className="pt-5 text-center text-sm text-ink-muted">
        Ainda não tem acesso?{" "}
        <a className="font-semibold text-accent-dark hover:text-accent" href="mailto:suporte@veriq.local">
          Solicitar acesso
        </a>
      </p>

      <p className="flex items-center justify-center gap-2 text-center text-sm text-ink-muted">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Seus dados estão protegidos com criptografia de ponta a ponta.
      </p>
    </form>
  );
}

