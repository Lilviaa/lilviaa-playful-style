import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — lilviaa" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success("Reset link sent!", { description: "Check your email for instructions." });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-butter text-primary shadow-cute">
        <KeyRound className="h-8 w-8" />
      </div>
      <h1 className="font-display text-4xl text-cocoa">Reset password</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-cute sm:p-8">
        {!submitted ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-border bg-background"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95"
            >
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-cocoa font-medium mb-4">We've sent an email to <strong>{email}</strong>.</p>
            <p className="text-sm text-muted-foreground mb-6">Please check your inbox and follow the instructions to reset your password.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Try another email
            </button>
          </div>
        )}
      </div>

      <Link
        to="/login"
        className="mt-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to log in
      </Link>
    </div>
  );
}
