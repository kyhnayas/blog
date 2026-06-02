"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { withTimeout, TimeoutError } from "@/lib/utils/timeout";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(errorParam ? { type: "error", text: errorParam } : null);

  const supabase = createClient();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (useMagicLink) {
        const response = await withTimeout(
          supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          }),
          10000
        );
        if (response.error) throw response.error;
        setMessage({
          type: "success",
          text: "We sent a Magic Link to your email. Please check your inbox and spam folder!",
        });
      } else if (isSignUp) {
        if (!username || username.length < 3) {
          throw new Error("Username must be at least 3 characters long");
        }
        const response = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                username: username.toLowerCase().trim(),
                full_name: fullName.trim(),
              },
            },
          }),
          10000
        );
        if (response.error) throw response.error;
        setMessage({
          type: "success",
          text: "Registration successful! Please check your email to confirm your account.",
        });
      } else {
        const response = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          10000
        );
        if (response.error) throw response.error;

        setMessage({
          type: "success",
          text: "Welcome back! Redirecting you...",
        });
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorMsg = err instanceof TimeoutError
        ? 'Authentication request timed out. Please check your connection and try again.'
        : err.message || "An error occurred during authentication.";
      setMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="gradient-bg p-2 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              kayhanayas
              <span className="gradient-text font-extrabold">.com</span>
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            {isSignUp
              ? "Create your author account"
              : "Welcome back to the platform"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isSignUp
              ? "Join our premium network of content creators"
              : "Sign in to access your dashboard, read and write"}
          </p>
        </div>

        <div className="glassmorphism rounded-3xl p-8 shadow-2xl relative border border-zinc-800/50">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === "success"
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/30 border-rose-500/30 text-rose-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span className="text-sm font-medium leading-relaxed">
                {message.text}
              </span>
            </div>
          )}

          <div className="flex bg-zinc-900/60 p-1 rounded-xl mb-8 border border-zinc-800/30">
            <button
              onClick={() => {
                setIsSignUp(false);
                setMessage(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isSignUp
                  ? "bg-zinc-800 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setMessage(null);
                setUseMagicLink(false);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isSignUp
                  ? "bg-zinc-800 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="kayhan_editor"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Kayhan Ayas"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {!useMagicLink && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setUseMagicLink(true)}
                      className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(!useMagicLink)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Sparkles
                    className={`h-3.5 w-3.5 text-primary-400 ${
                      useMagicLink ? "animate-pulse" : ""
                    }`}
                  />
                  {useMagicLink
                    ? "Use email & password instead"
                    : "Sign in passwordless (Magic Link)"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : useMagicLink ? "Send Magic Link" : "Sign In"}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500 leading-relaxed">
            By signing in, you agree to our{" "}
            <span className="text-zinc-400 hover:underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-zinc-400 hover:underline cursor-pointer">
              Privacy Policy
            </span>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div />}>
      <LoginForm />
    </Suspense>
  );
}
