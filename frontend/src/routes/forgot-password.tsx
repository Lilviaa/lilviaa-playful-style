import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, ArrowLeft, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

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
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (step === 2 && otp.length === 6 && !otpVerified) {
      verifyOtp();
    }
  }, [otp]);

  async function verifyOtp() {
    setLoading(true);
    setOtpError("");
    try {
      const res = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        throw new Error("Invalid or expired OTP");
      }
      setOtpVerified(true);
      toast.success("OTP Verified!", { description: "You can now set a new password." });
    } catch (err: any) {
      setOtpError("Wrong OTP, try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function requestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to send OTP");
      }
      
      setStep(2);
      toast.success("OTP Sent!", { description: "Check your email for the reset code." });
      
      // Calculate backoff timer: 30s, 60s, 120s... max 5 mins
      const nextTimeout = Math.min(30 * Math.pow(2, resendCount), 300);
      setResendCountdown(nextTimeout);
      setResendCount(prev => prev + 1);
      
    } catch (err: any) {
      toast.error("Error", { description: err.message || "Failed to send reset code." });
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiFetch("/auth/reset-password-with-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to reset password");
      }
      
      toast.success("Password reset successfully!", { description: "You can now log in with your new password." });
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error("Error", { description: err.message || "Failed to reset password." });
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
        {step === 1 
          ? "Enter your email address and we'll send you an OTP to reset your password."
          : "Enter the OTP sent to your email and your new password."}
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-cute sm:p-8">
        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium leading-none text-cocoa">
                6-Digit OTP
              </label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-widest font-mono rounded-xl border-2 border-border bg-background px-4 py-2 text-lg text-cocoa focus:border-primary focus:outline-none"
                required
                disabled={loading || otpVerified}
              />
              {otpError && <p className="text-sm font-semibold text-destructive mt-1">{otpError}</p>}
            </div>
            
            {otpVerified && (
              <>
                <div className="space-y-2">
                  <label htmlFor="new_password" className="text-sm font-medium leading-none text-cocoa">
                    New Password
                  </label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-sm font-medium leading-none text-cocoa">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" /> {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}
            
            
            <div className="text-center pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => requestOtp()}
                disabled={resendCountdown > 0 || loading || otpVerified}
                className={`text-sm font-semibold transition-colors ${
                  resendCountdown > 0 || otpVerified
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary hover:underline"
                }`}
              >
                {resendCountdown > 0 
                  ? `Resend OTP in ${resendCountdown}s` 
                  : "Didn't receive code? Resend"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpVerified(false);
                  setOtp("");
                }}
                className="text-sm font-semibold text-muted-foreground hover:text-primary hover:underline"
              >
                Wrong email? Go back
              </button>
            </div>
          </form>
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
