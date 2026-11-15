import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Cloud } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      const { data: { session } } = await api.auth.getSession();
      if (session && !cancelled) {
        navigate("/");
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.auth.signUp(signupEmail, signupPassword);

      toast.success("Account created! Please login.");
      setLoginEmail(signupEmail);
      setLoginPassword("");
      setSignupPassword("");
      setActiveTab("login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign up";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.auth.signInWithPassword(loginEmail, loginPassword);

      toast.success("Logged in successfully!");
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center app-page-canvas p-4">
      <Card className="w-full max-w-md shadow-xl shadow-slate-900/5 border-slate-200 bg-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-1 shadow-sm shadow-blue-600/20">
            <Cloud className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome to VPS File Hub
          </CardTitle>
          <CardDescription className="text-slate-600">
            Store and manage your files on your own server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 min-h-[44px] p-1">
              <TabsTrigger value="login" className="min-h-[36px] data-[state=active]:bg-white data-[state=active]:text-blue-600">Login</TabsTrigger>
              <TabsTrigger value="signup" className="min-h-[36px] data-[state=active]:bg-white data-[state=active]:text-blue-600">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-700">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="min-h-[44px] bg-slate-50 border-slate-500 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-700">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="min-h-[44px] bg-slate-50 border-slate-500 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>
                <Button type="submit" className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="min-h-[44px] bg-slate-50 border-slate-500 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={8}
                    className="min-h-[44px] bg-slate-50 border-slate-500 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>
                <Button type="submit" className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Auth;
