import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { MAX_FILES_UPLOAD, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

interface FieldState {
  value: string;
  dirty: boolean;
  blurred: boolean;
}

const initialFieldState = (initialValue = ""): FieldState => ({
  value: initialValue,
  dirty: false,
  blurred: false,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter your email address — like name@example.com.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Enter an email address in the format name@example.com.";
  }
  return null;
};

const validatePassword = (value: string, isSignUp: boolean): string | null => {
  if (!value) {
    return isSignUp
      ? "Create a password with 8 or more characters."
      : "Enter your password to sign in.";
  }
  if (isSignUp && value.length < 8) {
    return "Use 8 or more characters — a short passphrase works well.";
  }
  return null;
};

const Auth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(() => {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return typeof envClientId === "string" && envClientId.trim() ? envClientId.trim() : null;
  });
  const [authConfigLoading, setAuthConfigLoading] = useState(true);

  const [loginEmail, setLoginEmail] = useState<FieldState>(() => initialFieldState());
  const [loginPassword, setLoginPassword] = useState<FieldState>(() => initialFieldState());
  const [loginSubmitted, setLoginSubmitted] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginServerError, setLoginServerError] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const [signupEmail, setSignupEmail] = useState<FieldState>(() => initialFieldState());
  const [signupPassword, setSignupPassword] = useState<FieldState>(() => initialFieldState());
  const [signupSubmitted, setSignupSubmitted] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupServerError, setSignupServerError] = useState<string | null>(null);

  const loginEmailRef = useRef<HTMLInputElement | null>(null);
  const loginPasswordRef = useRef<HTMLInputElement | null>(null);
  const signupEmailRef = useRef<HTMLInputElement | null>(null);
  const signupPasswordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      const [{ data: { session } }, config] = await Promise.all([
        api.auth.getSession(),
        api.auth.getConfig(),
      ]);
      if (cancelled) return;
      if (session) {
        navigate("/");
        return;
      }
      if (config.googleClientId) {
        setGoogleClientId(config.googleClientId);
      }
      setAuthConfigLoading(false);
    };
    initAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleGoogleCredential = async (credential: string) => {
    setLoginServerError(null);
    setSignupServerError(null);
    setLoading(true);
    try {
      await api.auth.signInWithGoogle(credential);
      toast.success("Signed in with Google!");
      navigate("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to authenticate with Google";
      if (activeTab === "signup") {
        setSignupServerError(message);
      } else {
        setLoginServerError(message);
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleUnavailable = (reason: string) => {
    if (activeTab === "signup") {
      setSignupServerError(reason);
    } else {
      setLoginServerError(reason);
    }
  };

  const handleTabChange = (nextTab: string) => {
    const mode: AuthMode = nextTab === "signup" ? "signup" : "login";
    setActiveTab(mode);
    setLoginServerError(null);
    setSignupServerError(null);
  };

  const loginEmailError =
    (loginEmail.dirty && loginEmail.blurred) || loginSubmitted
      ? validateEmail(loginEmail.value)
      : null;
  const loginPasswordError =
    (loginPassword.dirty && loginPassword.blurred) || loginSubmitted
      ? validatePassword(loginPassword.value, false)
      : null;

  const signupEmailError =
    (signupEmail.dirty && signupEmail.blurred) || signupSubmitted
      ? validateEmail(signupEmail.value)
      : null;
  const signupPasswordError =
    (signupPassword.dirty && signupPassword.blurred) || signupSubmitted
      ? validatePassword(signupPassword.value, true)
      : null;

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoginSubmitted(true);
    setLoginServerError(null);

    const emailErr = validateEmail(loginEmail.value);
    const passwordErr = validatePassword(loginPassword.value, false);

    if (emailErr) {
      loginEmailRef.current?.focus();
      return;
    }
    if (passwordErr) {
      loginPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      await api.auth.signInWithPassword(loginEmail.value.trim(), loginPassword.value);
      toast.success("Logged in successfully!");
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign in";
      setLoginServerError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSignupSubmitted(true);
    setSignupServerError(null);

    const emailErr = validateEmail(signupEmail.value);
    const passwordErr = validatePassword(signupPassword.value, true);

    if (emailErr) {
      signupEmailRef.current?.focus();
      return;
    }
    if (passwordErr) {
      signupPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = signupEmail.value.trim();
      await api.auth.signUp(normalizedEmail, signupPassword.value);

      toast.success("Account created! Please login.");
      setLoginEmail({ value: normalizedEmail, dirty: true, blurred: true });
      setLoginPassword(initialFieldState());
      setLoginSubmitted(false);
      setLoginServerError(null);
      setLoginNotice("Account created. Sign in with your new credentials.");
      setSignupPassword(initialFieldState());
      setSignupSubmitted(false);
      setShowSignupPassword(false);
      setActiveTab("login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign up";
      setSignupServerError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass =
    "min-h-[48px] rounded-lg bg-white/95 border-slate-500 text-slate-950 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600";
  const inputErrorClass =
    "min-h-[48px] rounded-lg bg-red-50/70 border-red-600 text-slate-950 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:border-red-600";

  return (
    <div className="min-h-[100dvh] flex flex-col app-page-canvas relative overflow-x-clip">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div
        className="hero-architectural-grid absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-slate-300/75 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between min-h-16 py-2 gap-3">
          <Link to="/" className="group inline-flex items-center gap-2.5 min-h-[44px]">
            <span className="w-8 h-8 rounded-lg border border-slate-300/90 bg-white flex items-center justify-center shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-colors group-hover:border-blue-400">
              <Cloud className="w-4 h-4 text-blue-600" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">
              VPS File Hub
            </span>
          </Link>

          <Link
            to="/"
            className="group inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-slate-300/90 bg-white/90 text-xs font-medium text-slate-800 hover:bg-white hover:border-slate-400 hover:text-slate-950 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]"
          >
            <ArrowLeft
              className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-950 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 flex-1 flex items-center py-8 sm:py-12 lg:py-16"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-5 lg:pt-2">
              <p className="inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-700">
                <span
                  className="inline-block w-2 h-2 bg-blue-600 ring-4 ring-blue-600/15 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-mono text-blue-700 font-semibold">03</span>
                <span aria-hidden="true" className="text-slate-400">
                  /
                </span>
                <span>Authentication</span>
              </p>

              <h1 className="text-[clamp(2rem,4vw,3.15rem)] font-bold tracking-[-0.035em] leading-[1.06] text-slate-950">
                {activeTab === "login" ? (
                  <>
                    Access your{" "}
                    <span className="text-blue-600">private vault.</span>
                  </>
                ) : (
                  <>
                    Create your{" "}
                    <span className="text-blue-600">server account.</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-md">
                {activeTab === "login"
                  ? "Sign in to upload files straight to your server, manage access controls, and create scoped public links."
                  : `Register an account to upload up to ${MAX_FILES_UPLOAD} files per batch and control exactly which files are shared publicly.`}
              </p>

              <div className="hidden lg:block hero-glass-surface rounded-xl p-5 space-y-4 mt-2">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-slate-600">
                  <span>Vault Guarantees</span>
                  <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Private First
                  </span>
                </div>

                <ul className="space-y-2.5 border-t border-slate-200/80 pt-3.5 text-xs text-slate-700">
                  <li className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                      <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                      Default file access
                    </span>
                    <span className="font-mono text-[11px] text-slate-600">Auth-protected</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                      <ShieldCheck
                        className="w-3.5 h-3.5 text-blue-700 shrink-0"
                        aria-hidden="true"
                      />
                      Upload verification
                    </span>
                    <span className="font-mono text-[11px] text-slate-600">MIME + signature</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                      <Cloud className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                      Batch capacity
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-slate-600">
                      {MAX_FILES_UPLOAD} files · {MAX_FILE_SIZE_MB} MB
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <div className="hero-glass-surface rounded-2xl p-5 sm:p-8">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList
                    aria-label="Authentication mode"
                    className="grid w-full grid-cols-2 mb-6 bg-slate-100/90 border border-slate-300/85 min-h-[48px] p-1 rounded-lg"
                  >
                    <TabsTrigger
                      value="login"
                      className="relative min-h-[38px] rounded-md text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none aria-selected:bg-blue-600 aria-selected:text-white after:content-[''] after:absolute after:inset-x-3 after:bottom-1 after:border-b-2 after:border-transparent aria-selected:after:border-white"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="relative min-h-[38px] rounded-md text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none aria-selected:bg-blue-600 aria-selected:text-white after:content-[''] after:absolute after:inset-x-3 after:bottom-1 after:border-b-2 after:border-transparent aria-selected:after:border-white"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0 space-y-5">
                    {loginNotice && (
                      <div
                        role="status"
                        className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/80 px-3.5 py-3 text-xs text-blue-900"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-blue-700 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{loginNotice}</span>
                      </div>
                    )}

                    {loginServerError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-900"
                      >
                        <AlertCircle
                          className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{loginServerError}</span>
                      </div>
                    )}

                    <GoogleAuthButton
                      mode="login"
                      clientId={googleClientId}
                      configLoading={authConfigLoading}
                      disabled={loading}
                      onCredential={handleGoogleCredential}
                      onUnavailableClick={handleGoogleUnavailable}
                    />

                    <div className="relative flex items-center" aria-hidden="true">
                      <div className="flex-grow border-t border-slate-300/80" />
                      <span className="shrink-0 px-3 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-600">
                        or continue with email
                      </span>
                      <div className="flex-grow border-t border-slate-300/80" />
                    </div>

                    <form
                      onSubmit={handleSignIn}
                      noValidate
                      aria-label="Sign in to VPS File Hub"
                      className="space-y-5"
                    >

                      <div className="space-y-1.5">
                        <Label htmlFor="login-email" className="text-slate-800 font-medium">
                          Email Address
                        </Label>
                        <Input
                          ref={loginEmailRef}
                          id="login-email"
                          name="email"
                          type="email"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          enterKeyHint="next"
                          placeholder="name@example.com"
                          value={loginEmail.value}
                          aria-invalid={loginEmailError ? "true" : "false"}
                          aria-describedby={loginEmailError ? "login-email-error" : undefined}
                          onChange={(e) => {
                            setLoginServerError(null);
                            setLoginEmail((prev) => ({
                              ...prev,
                              value: e.target.value,
                              dirty: true,
                            }));
                          }}
                          onBlur={() =>
                            setLoginEmail((prev) => ({
                              ...prev,
                              blurred: true,
                            }))
                          }
                          required
                          className={loginEmailError ? inputErrorClass : inputBaseClass}
                        />
                        {loginEmailError && (
                          <p
                            id="login-email-error"
                            className="flex items-start gap-1.5 text-xs font-medium text-red-700 pt-0.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{loginEmailError}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="login-password" className="text-slate-800 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            ref={loginPasswordRef}
                            id="login-password"
                            name="password"
                            type={showLoginPassword ? "text" : "password"}
                            autoComplete="current-password"
                            enterKeyHint="done"
                            placeholder="••••••••"
                            value={loginPassword.value}
                            aria-invalid={loginPasswordError ? "true" : "false"}
                            aria-describedby={
                              loginPasswordError ? "login-password-error" : undefined
                            }
                            onChange={(e) => {
                              setLoginServerError(null);
                              setLoginPassword((prev) => ({
                                ...prev,
                                value: e.target.value,
                                dirty: true,
                              }));
                            }}
                            onBlur={() =>
                              setLoginPassword((prev) => ({
                                ...prev,
                                blurred: true,
                              }))
                            }
                            required
                            className={`${
                              loginPasswordError ? inputErrorClass : inputBaseClass
                            } pr-12`}
                          />
                          <button
                            type="button"
                            aria-pressed={showLoginPassword}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                            aria-describedby="login-password-toggle-warning"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-md inline-flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 transition-colors"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                          <span id="login-password-toggle-warning" className="sr-only">
                            Warning: this will display your password on the screen.
                          </span>
                        </div>
                        {loginPasswordError && (
                          <p
                            id="login-password-error"
                            className="flex items-start gap-1.5 text-xs font-medium text-red-700 pt-0.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{loginPasswordError}</span>
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="group w-full min-h-[48px] rounded-full bg-slate-950 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_6px_-2px_rgba(15,23,42,0.22)] transition-colors duration-200"
                      >
                        <span>{loading ? "Authenticating..." : "Sign In"}</span>
                        {!loading && (
                          <ArrowRight
                            className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0 space-y-5">
                    {signupServerError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-900"
                      >
                        <AlertCircle
                          className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{signupServerError}</span>
                      </div>
                    )}

                    <GoogleAuthButton
                      mode="signup"
                      clientId={googleClientId}
                      configLoading={authConfigLoading}
                      disabled={loading}
                      onCredential={handleGoogleCredential}
                      onUnavailableClick={handleGoogleUnavailable}
                    />

                    <div className="relative flex items-center" aria-hidden="true">
                      <div className="flex-grow border-t border-slate-300/80" />
                      <span className="shrink-0 px-3 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-600">
                        or sign up with email
                      </span>
                      <div className="flex-grow border-t border-slate-300/80" />
                    </div>

                    <form
                      onSubmit={handleSignUp}
                      noValidate
                      aria-label="Create a VPS File Hub account"
                      className="space-y-5"
                    >

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-slate-800 font-medium">
                          Email Address
                        </Label>
                        <Input
                          ref={signupEmailRef}
                          id="signup-email"
                          name="email"
                          type="email"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          enterKeyHint="next"
                          placeholder="name@example.com"
                          value={signupEmail.value}
                          aria-invalid={signupEmailError ? "true" : "false"}
                          aria-describedby={signupEmailError ? "signup-email-error" : undefined}
                          onChange={(e) => {
                            setSignupServerError(null);
                            setSignupEmail((prev) => ({
                              ...prev,
                              value: e.target.value,
                              dirty: true,
                            }));
                          }}
                          onBlur={() =>
                            setSignupEmail((prev) => ({
                              ...prev,
                              blurred: true,
                            }))
                          }
                          required
                          className={signupEmailError ? inputErrorClass : inputBaseClass}
                        />
                        {signupEmailError && (
                          <p
                            id="signup-email-error"
                            className="flex items-start gap-1.5 text-xs font-medium text-red-700 pt-0.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{signupEmailError}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-slate-800 font-medium">
                          Password
                        </Label>
                        <p id="signup-password-hint" className="text-xs text-slate-600">
                          Use 8 or more characters — a short passphrase works well.
                        </p>
                        <div className="relative">
                          <Input
                            ref={signupPasswordRef}
                            id="signup-password"
                            name="new-password"
                            type={showSignupPassword ? "text" : "password"}
                            autoComplete="new-password"
                            enterKeyHint="done"
                            placeholder="••••••••"
                            value={signupPassword.value}
                            aria-invalid={signupPasswordError ? "true" : "false"}
                            aria-describedby={
                              signupPasswordError
                                ? "signup-password-hint signup-password-error"
                                : "signup-password-hint"
                            }
                            onChange={(e) => {
                              setSignupServerError(null);
                              setSignupPassword((prev) => ({
                                ...prev,
                                value: e.target.value,
                                dirty: true,
                              }));
                            }}
                            onBlur={() =>
                              setSignupPassword((prev) => ({
                                ...prev,
                                blurred: true,
                              }))
                            }
                            required
                            minLength={8}
                            className={`${
                              signupPasswordError ? inputErrorClass : inputBaseClass
                            } pr-12`}
                          />
                          <button
                            type="button"
                            aria-pressed={showSignupPassword}
                            aria-label={showSignupPassword ? "Hide password" : "Show password"}
                            aria-describedby="signup-password-toggle-warning"
                            onClick={() => setShowSignupPassword((prev) => !prev)}
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-md inline-flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 transition-colors"
                          >
                            {showSignupPassword ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                          <span id="signup-password-toggle-warning" className="sr-only">
                            Warning: this will display your password on the screen.
                          </span>
                        </div>
                        {signupPasswordError && (
                          <p
                            id="signup-password-error"
                            className="flex items-start gap-1.5 text-xs font-medium text-red-700 pt-0.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{signupPasswordError}</span>
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="group w-full min-h-[48px] rounded-full bg-slate-950 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_6px_-2px_rgba(15,23,42,0.22)] transition-colors duration-200"
                      >
                        <span>{loading ? "Creating account..." : "Create Account"}</span>
                        {!loading && (
                          <ArrowRight
                            className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
