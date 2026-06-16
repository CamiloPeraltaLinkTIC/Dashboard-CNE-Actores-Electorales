"use client";

import React, { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { User, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { signIn, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl accent-bg py-3 text-sm font-black text-black transition-all hover:neon-glow disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4.5 w-4.5 animate-spin" />
      ) : (
        <>
          <ShieldCheck className="h-4.5 w-4.5" />
          Ingresar
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, initialState);
  const [show, setShow] = React.useState(false);

  return (
    <div className="grid-overlay flex min-h-[100dvh] items-center justify-center px-4">
      <div className="glass-strong neon-border w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl accent-bg text-2xl font-black text-black neon-glow animate-floaty">
            C
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">MARTHA</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--text-faint)]">
            Centro de Mando · CNE / AE
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              name="email"
              type="text"
              autoComplete="username"
              required
              placeholder="Usuario o correo"
              className="glass w-full rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Contraseña de acceso"
              className="glass w-full rounded-xl py-3 pl-11 pr-11 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--accent)]"
            >
              {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-center text-xs font-semibold text-rose-300">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-[10px] text-[var(--text-faint)]">
          Acceso restringido · Sesión segura
        </p>
      </div>
    </div>
  );
}
