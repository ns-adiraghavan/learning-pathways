import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, User } from "lucide-react";

import { BrandLockup, Wordmark } from "@/components/brand-lockup";
import { DoodleField } from "@/components/doodle-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Lessons at Netscribes" },
      {
        name: "description",
        content: "Sign in to Lessons, the Netscribes learning platform, with your employee ID or Netscribes ID.",
      },
      { property: "og:title", content: "Sign in — Lessons at Netscribes" },
      {
        property: "og:description",
        content: "Sign in to Lessons, the Netscribes learning platform, with your employee ID or Netscribes ID.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [userId, setUserId] = useState("E4212");
  const [password, setPassword] = useState("lessons");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  function signIn(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    window.setTimeout(() => navigate({ to: "/home" }), 650);
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <DoodleField />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-7 flex flex-col items-center gap-4 text-center">
          <BrandLockup size="sm" markOnly />
          <Wordmark size="xl" />
          <p className="text-sm text-muted-foreground">
            Return on knowledge — sign in to keep learning.
          </p>
        </div>

        <form onSubmit={signIn} className="surface space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="userId" className="text-label">
              User ID
            </Label>
            <div className="relative">
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
                className="pr-9"
              />
              <User
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-brand-blue"
                strokeWidth={1.75}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-label">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? (
                  <EyeOff className="size-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button type="submit" disabled={busy} className="min-w-28">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Signing in" : "Sign in"}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot credentials?
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or sign in with</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full text-brand-blue"
            onClick={() => signIn()}
          >
            Netscribes ID
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Demo sign-in — any credentials will take you into Lessons.
        </p>
      </motion.div>
    </div>
  );
}
