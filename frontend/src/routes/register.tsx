import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { UserPlus, UserCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: search.redirect as string | undefined,
    }
  },
  head: () => ({
    meta: [
      { title: "Sign Up — lilviaa" },
    ],
  }),
  component: RegisterPage,
});

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[^a-zA-Z]/, { message: "Password must contain at least one number or special character." }),
});

function RegisterPage() {
  const { registerUser, user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Guard: If already logged in, redirect away from register page
  useEffect(() => {
    if (user && !isLoading) {
      import("@/lib/firebase").then(({ auth }) => {
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          navigate({ to: "/verify-account", search: { email: user.email }, replace: true });
        } else if (search.redirect) {
          navigate({ to: search.redirect, replace: true });
        } else if (user.role === "admin") {
          navigate({ to: "/admin", replace: true });
        } else {
          navigate({ to: "/account", replace: true });
        }
      });
    }
  }, [user, isLoading, navigate, search.redirect]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMsg("");
    setIsLoading(true);
    try {
      const result = await registerUser({
        full_name: values.fullName, // Match backend snake_case key
        email: values.email,
        phone: values.phone,
        password: values.password
      });
      if (result?.requires_verification) {
        navigate({ to: "/verify-account", search: { email: values.email }, replace: true });
      } else if (search.redirect) {
        navigate({ to: search.redirect, replace: true });
      } else if (result?.role === "admin") {
        navigate({ to: "/admin", replace: true });
      } else {
        navigate({ to: "/account", replace: true });
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to register. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-butter text-primary shadow-cute">
        <UserCircle className="h-8 w-8" />
      </div>
      <h1 className="font-display text-4xl text-cocoa">Create an account</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Join the lilviaa family to track orders and save your favorites.
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-cute sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} className="rounded-xl border-border bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} className="rounded-xl border-border bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+91 98765 43210" {...field} className="rounded-xl border-border bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        className="rounded-xl border-border bg-background pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMsg && (
              <div className="text-sm text-red-500 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Create Account
                </>
              )}
            </button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#d8c3a5]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#fdfaf6] text-[#8e8d8a] uppercase tracking-wider">
                Or sign up with
              </span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={async () => {
              try {
                await loginWithGoogle();
                navigate({ to: search.redirect || "/account" });
              } catch (err: any) {
                setErrorMsg(err.message || "Failed to sign up with Google");
              }
            }}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#d8c3a5] rounded-xl text-[#605a54] bg-white hover:bg-[#fdfaf6] transition-colors shadow-sm font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

