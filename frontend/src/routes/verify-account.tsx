import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/verify-account")({
  head: () => ({
    meta: [
      { title: "Verify Account â€” lilviaa" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: (search.email as string) || "",
  }),
  component: VerifyAccountPage,
});

function VerifyAccountPage() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Initialize countdown from sessionStorage if the page is reloaded
  useEffect(() => {
    const sentAt = sessionStorage.getItem("verificationSentAt");
    if (!sentAt) {
      // If no timestamp, assume the email was just sent during registration
      sessionStorage.setItem("verificationSentAt", Date.now().toString());
      setResendCountdown(60);
    } else {
      const elapsed = Math.floor((Date.now() - parseInt(sentAt)) / 1000);
      if (elapsed < 60) {
        setResendCountdown(60 - elapsed);
      }
    }
  }, []);

  // Handle the countdown timer ticking
  useEffect(() => {
    if (resendCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Poll Firebase to check if the user has clicked the link in the other tab
  useEffect(() => {
    // Only start polling when Firebase has finished initializing the user
    if (!auth.currentUser) return;

    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          toast.success("Account Verified!", { description: "You have been automatically logged in." });
          navigate({ to: "/account", replace: true });
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [user, navigate]); // Added 'user' to dependencies so it triggers after Firebase loads

  async function resendVerificationLink() {
    if (!auth.currentUser) {
      toast.error("You must be logged in to resend the verification link.");
      return;
    }
    
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Link Resent!", { description: "Check your email for the new verification link." });

      sessionStorage.setItem("verificationSentAt", Date.now().toString());
      setResendCountdown(60);
    } catch (err: any) {
      if (err.code === "auth/too-many-requests" || err.message?.includes("too-many-requests")) {
        toast.error("Please wait a moment", { description: "We recently sent an email. Please check your spam folder or wait a minute before trying again." });
      } else {
        toast.error("Error", { description: err.message || "Failed to resend link." });
      }
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
        We've sent a secure verification link to <strong className="text-cocoa">{email}</strong>.
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-cute sm:p-8 text-center space-y-6">
        <div className="text-sm text-cocoa">
          <p className="mb-4">
            Please check your inbox and click the secure link we sent to verify your account. 
          </p>
          <p className="font-medium text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <strong>Important:</strong> If you do not see the email in your inbox within a few minutes, please check your <strong>Spam or Junk folder</strong>.
          </p>
          <p className="mt-4 text-muted-foreground">
            Once you click the link, this page will automatically log you in!
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={resendVerificationLink}
            disabled={resendCountdown > 0 || loading}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-pop transition-transform ${
              resendCountdown > 0 || loading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
            }`}
          >
            {loading ? "Sending..." : resendCountdown > 0 ? `Resend Link in ${resendCountdown}s` : "Resend Verification Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

