import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Access Terminal — Discipline OS" },
      { name: "description", content: "Log in or create an account to access your Discipline OS terminal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setError("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 scanlines">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-xs text-muted-foreground hover:text-primary">
          &larr; back to home
        </Link>
        <div className="glow-box rounded-lg border border-border bg-card/80 p-6 backdrop-blur">
          <div className="mb-1 text-xs text-accent glow-accent">root@discipline:~$</div>
          <h1 className="mb-6 text-2xl font-bold text-primary glow-primary">
            {mode === "login" ? "./access --login" : "./register --new"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="username" value={username} onChange={setUsername} placeholder="hacker_01" />
            )}
            <Field label="email" type="email" value={email} onChange={setEmail} placeholder="you@domain.com" required />
            <Field
              label="password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />

            {error && <p className="text-sm text-destructive">! {error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary px-4 py-2.5 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "processing..." : mode === "login" ? "[ ENTER SYSTEM ]" : "[ CREATE ACCOUNT ]"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-secondary-foreground transition hover:border-accent"
          >
            continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "no account yet? " : "already registered? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-primary hover:underline"
            >
              {mode === "login" ? "register" : "login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}
