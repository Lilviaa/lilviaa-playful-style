import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — lilviaa" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setErrorMsg("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setIsSuccess(true);
      toast.success("Reset Email Sent", { description: "Check your inbox for the password reset link." });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset email. Please try again.");
      toast.error("Error", { description: err.message || "Failed to send reset email." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-butter text-primary shadow-cute">
        <KeyRound className="h-8 w-8" />
      </div>
      <h1 className="font-display text-4xl text-cocoa">Reset password</h1>
      <p className="mt-2 text-center text-muted-foreground">
        {isSuccess 
          ? "We've sent a password reset link to your email."
          : "Enter your email address and we'll send you a link to reset your password."}
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-cute sm:p-8">
        {!isSuccess ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-cocoa">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                required
                disabled={loading}
              />
            </div>
            
            {errorMsg && (
              <div className="text-sm text-red-500 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send Reset Link
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-sm text-cocoa w-full">
              <p className="mb-4 text-center">
                Please check your inbox at <span className="font-bold">{email}</span>.
              </p>
              <p className="font-medium text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 mb-4 text-center">
                <strong>Important:</strong> If you do not see the email in your inbox within a few minutes, please check your <strong>Spam or Junk folder</strong>.
              </p>
              <p className="text-muted-foreground text-center">
                Didn't receive an email? Check your spam folder or try again.
              </p>
            </div>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Try another email address
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
