"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

function destination(callbackUrl: string | null) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }
  return callbackUrl;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  function readCapsLock(event: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || signedIn) return;
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        const message =
          res.code === "inactive_account"
            ? "This account is inactive. Ask an admin to restore access."
            : res.error === "CredentialsSignin"
              ? "Invalid email or password"
              : "Unable to sign in. Try again.";
        setError(message);
        setShake((value) => value + 1);
        setLoading(false);
        return;
      }
      if (!res?.ok) {
        setError("Unable to sign in. Try again.");
        setShake((value) => value + 1);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      const next = destination(params.get("callbackUrl"));
      window.setTimeout(() => {
        router.push(next);
        router.refresh();
      }, reduce ? 0 : 280);
    } catch {
      setError("Unable to sign in. Try again.");
      setShake((value) => value + 1);
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={false}
      animate={reduce || shake === 0 ? { x: 0 } : { x: [0, -6, 5, -3, 0] }}
      transition={{ duration: 0.35 }}
      className="login-rise w-full max-w-[440px]"
    >
      <form
        onSubmit={onSubmit}
        className="rounded-[22px] border border-border bg-white px-7 py-8 shadow-[var(--shadow-floating)] sm:px-8 sm:py-9"
      >
        <div className="space-y-5">
          <div>
            <h2 className="text-[1.7rem] font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Sign in to continue to your LUMINA workspace.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading || signedIn}
                className="h-12 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm outline-none transition focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={readCapsLock}
                onKeyUp={readCapsLock}
                disabled={loading || signedIn}
                className="h-12 w-full rounded-xl border border-border bg-white pl-10 pr-11 text-sm outline-none transition focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {capsLock && <p className="text-xs text-warning">Caps Lock is on.</p>}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                aria-live="assertive"
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 rounded-xl border border-danger/20 bg-[#fdf2f1] px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading || signedIn}
            whileHover={reduce || loading ? undefined : { y: -1 }}
            whileTap={reduce || loading ? undefined : { scale: 0.985 }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {signedIn ? (
              "Signed in"
            ) : loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Signing in
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </div>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">LUMINA • Retail & Repair Management</p>
    </motion.div>
  );
}
