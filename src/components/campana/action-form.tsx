"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

interface ActionFormProps {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
}

export function ActionForm({ action, className = "", children }: ActionFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast({ kind: "success", title: state.message });
    } else {
      toast({ kind: "error", title: state.error });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
