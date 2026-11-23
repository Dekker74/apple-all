"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { OffcutShell } from "@/components/offcut/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(t("forgot.error"));
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  }

  return (
    <OffcutShell>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        {done ? (
          <>
            <CheckCircle2 className="size-11 text-moss" strokeWidth={1.5} />
            <h1 className="mt-5 text-[34px] leading-tight">{t("forgot.success")}</h1>
          </>
        ) : (
          <>
            <p className="eyebrow">Offcut</p>
            <h1 className="mt-3 text-[36px] leading-tight">{t("forgot.title")}</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">{t("forgot.desc")}</p>
          </>
        )}
        {done ? null : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="field-label">{t("signup.email")}</label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@azienda.it" className="mt-1.5" />
            </div>
            {error ? <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] text-danger">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("forgot.submit")} <ArrowRight className="size-4" />
            </Button>
          </form>
        )}
        <Button variant="link" asChild className="mt-5 px-0">
          <Link href="/login"><ArrowLeft className="size-3.5" /> {t("forgot.back")}</Link>
        </Button>
      </div>
    </OffcutShell>
  );
}
