"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteStoreName, setInviteStoreName] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const token = searchParams.get("invite");
    if (token) {
      setInviteToken(token);
      setIsSignUp(true);
      // Optionally look up the store name from the invite token
      supabase
        .from("store_invites")
        .select("stores(store_name), role")
        .eq("token", token)
        .is("used_by", null)
        .single()
        .then(({ data }) => {
          if (data) {
            const storeName = (data.stores as any)?.store_name;
            setInviteStoreName(storeName ? `${storeName} (${data.role})` : "");
          }
        });
    }
  }, [searchParams]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              ...(inviteToken ? { invite_token: inviteToken } : {})
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage("Check your email for a confirmation link! You can then log in and you'll be part of the store.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Left side — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative z-10 p-12">
        <div className="max-w-md">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <a href="/" className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Tindahan<span className="text-primary-400">POS</span>
              </span>
            </a>

            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Manage your store{" "}
              <span className="gradient-text">smarter</span>, not harder.
            </h1>

            <p className="text-lg text-surface-400 leading-relaxed mb-8">
              BIR-compliant receipts, real-time inventory, and offline resilience — all
              in one cloud dashboard built for Filipino entrepreneurs.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {["Offline Mode", "BIR Compliant", "GCash Ready", "Real-Time Stock"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-xs font-medium text-surface-300 glass-light rounded-full"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Tindahan<span className="text-primary-400">POS</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-surface-900/80 backdrop-blur-xl border border-surface-700/50 rounded-2xl p-8 shadow-2xl">

            {/* Invite Banner */}
            {inviteToken && (
              <div className="mb-5 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-start gap-2">
                <UserPlus className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary-300">You've been invited!</p>
                  {inviteStoreName && (
                    <p className="text-xs text-surface-400 mt-0.5">Store: <strong className="text-white">{inviteStoreName}</strong></p>
                  )}
                  <p className="text-xs text-surface-500 mt-1">Create your account to join this store as a staff member.</p>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {isSignUp ? (inviteToken ? "Join Store" : "Create Your Account") : "Welcome Back"}
              </h2>
              <p className="mt-1 text-sm text-surface-400">
                {isSignUp
                  ? (inviteToken ? "Create your account to join the store" : "Start managing your store in minutes")
                  : "Sign in to your TindahanPOS dashboard"}
              </p>
            </div>

            {/* Error / Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-coral-500/10 border border-coral-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-coral-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-coral-300">{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-300">{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (signup only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-surface-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    required={isSignUp}
                    className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors outline-none"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group flex items-center justify-center gap-2 gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-[var(--shadow-glow)] transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* OAuth Separator */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-700/50"></div>
              <span className="text-sm font-medium text-surface-500 uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-surface-700/50"></div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-surface-800 border border-surface-700 text-white font-medium hover:bg-surface-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continue with Google
            </button>

            {/* Toggle sign up / sign in */}
            <div className="mt-6 text-center">
              <p className="text-sm text-surface-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setMessage("");
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  {isSignUp ? "Sign In" : "Sign Up Free"}
                </button>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-surface-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-950 text-surface-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
