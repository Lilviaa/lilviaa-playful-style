import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/verify-account")({
  head: () => ({
    meta: [
      { title: "Verify Account — lilviaa" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  component: VerifyAccountPage,
});

function VerifyAccountPage() {
  const navigate = useNavigate();
  const { checkSession } = useAuth();
  const { email } = Route.useSearch();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendCount, setResendCount] = useState(1);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (otp.length === 6 && !otpVerified) {
      verifyAccount();
    }
  }, [otp]);

  async function verifyAccount() {
    setLoading(true);
    setOtpError("");
    try {
      const res = await apiFetch("/auth/verify-account", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Invalid OTP");
      }
      setOtpVerified(true);
      toast.success("Account Verified!", { description: "Welcome to Lilviaa!" });

      // The verify-account endpoint sets auth cookies, so fetch session
      await checkSession();
      
      // Redirect to homepage after a short delay
      setTimeout(() => {
        navigate({ to: "/", replace: true });
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || "Wrong OTP, try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setLoading(true);
    try {
      const res = await apiFetch("/auth/resend-verify-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        throw new Error("Failed to resend code");
      }
      toast.success("Code Resent!", { description: "Check your email for the new verification code." });

      // Calculate backoff timer: 30s, 60s, 120s... max 5 mins
      const nextTimeout = Math.min(30 * Math.pow(2, resendCount), 300);
      setResendCountdown(nextTimeout);
      setResendCount(prev => prev + 1);
    } catch (err: any) {
      toast.error("Error", { description: err.message || "Failed to resend code." });
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12">
        <p className="text-muted-foreground">No email provided. Please register first.</p>
        <Link to="/register" className="mt-4 text-primary hover:underline font-semibold">
          Go to Register
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-butter text-primary shadow-cute">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <h1 className="font-display text-4xl text-cocoa">Verify your email</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Enter the 6-digit code sent to <strong className="text-cocoa">{email}</strong>.
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-cute sm:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="verify-otp" className="text-sm font-medium leading-none text-cocoa">
              6-Digit Verification Code
            </label>
            <Input
              id="verify-otp"
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center tracking-widest font-mono rounded-xl border-2 border-border bg-background px-4 py-2 text-lg text-cocoa focus:border-primary focus:outline-none"
              required
              disabled={loading || otpVerified}
              autoFocus
            />
            {otpError && <p className="text-sm font-semibold text-destructive mt-1">{otpError}</p>}
            {otpVerified && (
              <p className="text-sm font-semibold text-green-600 mt-1">
                ✓ Verified! Redirecting...
              </p>
            )}
          </div>

          <div className="text-center pt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={resendOtp}
              disabled={resendCountdown > 0 || loading || otpVerified}
              className={`text-sm font-semibold transition-colors ${
                resendCountdown > 0 || otpVerified
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:underline"
              }`}
            >
              {resendCountdown > 0
                ? `Resend code in ${resendCountdown}s`
                : "Didn't receive code? Resend"}
            </button>
          </div>
        </div>
      </div>

      <Link
        to="/login"
        className="mt-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-cocoa transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to log in
      </Link>
    </div>
  );
}
