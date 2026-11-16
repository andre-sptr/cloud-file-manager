import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Cloud,
  FolderOpen,
  Lock,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api, subscribeAuthCleared } from "@/lib/api";
import { MAX_FILES_UPLOAD, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { scrollToSection } from "@/lib/scroll";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gallery");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await api.auth.getSession();

        if (!cancelled && session && session.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error("Failed to verify session:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const unsubscribe = subscribeAuthCleared(() => {
      if (!cancelled) {
        setUser(null);
        setActiveTab("gallery");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const scrollToUpload = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setActiveTab("upload");
    scrollToSection("dashboard");
  };

  const scrollToFeatures = () => {
    scrollToSection("features");
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === "upload" && !user) {
      setShowLoginDialog(true);
      return;
    }
    setActiveTab(nextTab);
  };

  const goToLogin = () => {
    setShowLoginDialog(false);
    navigate("/auth");
  };

  if (loading) {
    return (
      <main
        className="min-h-[100dvh] flex flex-col items-center justify-center p-4 app-page-canvas"
        role="status"
      >
        <div className="hero-glass-surface rounded-xl px-5 py-4 flex items-center gap-3.5">
          <div
            className="app-spinner rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
              VPS File Hub
            </p>
            <p className="text-sm font-medium text-slate-700">Verifying session...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <div className="flex-1 app-page-canvas flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar user={user} />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Hero onUploadClick={scrollToUpload} onFeaturesClick={scrollToFeatures} />

          <Features />

          <section
            id="dashboard"
            aria-labelledby="dashboard-heading"
            className="relative py-14 sm:py-20"
          >
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="relative border-t border-slate-300/80 pt-12 sm:pt-16">
                <span
                  aria-hidden="true"
                  className="absolute -top-[1.5px] left-0 h-[2px] w-16 bg-blue-600"
                />

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6 sm:mb-8">
                    <div className="space-y-3">
                      <p className="inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-700">
                        <span
                          className="inline-block w-2 h-2 bg-blue-600 ring-4 ring-blue-600/15 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-mono text-blue-700 font-semibold">02</span>
                        <span aria-hidden="true" className="text-slate-400">
                          /
                        </span>
                        <span>Workspace</span>
                      </p>

                      <h2
                        id="dashboard-heading"
                        className="text-2xl sm:text-3xl lg:text-[2.15rem] font-bold tracking-[-0.03em] leading-[1.12] text-slate-950"
                      >
                        VPS File <span className="text-blue-600">Manager.</span>
                      </h2>

                      <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl">
                        Upload, manage, and share your files securely on your own server.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {user ? (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300/85 bg-white/80 backdrop-blur-sm px-3 py-2 text-xs text-slate-700 min-h-[44px] max-w-full sm:max-w-[240px]">
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-blue-700 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate font-mono text-[11px] text-slate-700">
                            {user.email}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-between sm:justify-start gap-2.5 rounded-lg border border-slate-300/85 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-700 min-h-[44px]">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-600">
                              Guest view
                            </span>
                          </span>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => navigate("/auth")}
                            className="h-auto min-h-[32px] px-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Sign in
                          </Button>
                        </div>
                      )}

                      <TabsList
                        aria-label="Workspace views"
                        className="grid w-full sm:w-auto sm:min-w-[268px] grid-cols-2 bg-white/90 backdrop-blur-sm border border-slate-400/90 p-1 min-h-[48px] rounded-lg shrink-0"
                      >
                        <TabsTrigger
                          value="gallery"
                          className="relative min-h-[38px] gap-2 rounded-md text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none aria-selected:bg-blue-600 aria-selected:text-white after:content-[''] after:absolute after:inset-x-3 after:bottom-1 after:border-b-2 after:border-transparent aria-selected:after:border-white"
                        >
                          <FolderOpen className="w-4 h-4" aria-hidden="true" />
                          <span>Gallery</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="upload"
                          className="relative min-h-[38px] gap-2 rounded-md text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none aria-selected:bg-blue-600 aria-selected:text-white after:content-[''] after:absolute after:inset-x-3 after:bottom-1 after:border-b-2 after:border-transparent aria-selected:after:border-white"
                        >
                          {user ? (
                            <Upload className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>Upload</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>

                  <div className="hero-glass-surface rounded-xl px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="font-mono uppercase tracking-[0.12em] text-blue-700 font-semibold">
                        {activeTab === "gallery" ? "Vault Explorer" : "Batch Uploader"}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        |
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                        Max {MAX_FILE_SIZE_MB} MB / file · Up to {MAX_FILES_UPLOAD} files
                      </span>
                    </div>

                    {activeTab === "gallery" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTabChange("upload")}
                        className="min-h-[36px] px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Upload files</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTabChange("gallery")}
                        className="min-h-[36px] px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      >
                        <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Back to gallery</span>
                      </Button>
                    )}
                  </div>

                  <TabsContent value="gallery" className="mt-0">
                    <FileGallery user={user} />
                  </TabsContent>

                  <TabsContent value="upload" className="mt-0">
                    <div className="max-w-3xl mx-auto">
                      <FileUpload
                        onUploadComplete={() => {
                          setActiveTab("gallery");
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-slate-300/80 bg-white py-6">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md border border-slate-300/90 bg-slate-50 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-blue-600" strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <span className="font-semibold text-slate-900">VPS File Hub</span>
              <span className="hidden md:inline text-slate-600">
                {" "}
                — Self-hosted private storage
              </span>
            </div>
          </div>

          <nav aria-label="Footer" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#main-content"
              onClick={(event) => {
                event.preventDefault();
                const behavior: ScrollBehavior = window.matchMedia(
                  "(prefers-reduced-motion: reduce)"
                ).matches
                  ? "auto"
                  : "smooth";
                window.scrollTo({ top: 0, behavior });
              }}
              className="inline-flex items-center min-h-[44px] px-2.5 text-xs font-mono uppercase tracking-[0.1em] text-slate-600 hover:text-slate-950 transition-colors"
            >
              Overview
            </a>
            <a
              href="#features"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("features");
              }}
              className="inline-flex items-center min-h-[44px] px-2.5 text-xs font-mono uppercase tracking-[0.1em] text-slate-600 hover:text-slate-950 transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#dashboard"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("dashboard");
              }}
              className="inline-flex items-center min-h-[44px] px-2.5 text-xs font-mono uppercase tracking-[0.1em] text-slate-600 hover:text-slate-950 transition-colors"
            >
              Workspace
            </a>
          </nav>

          <a
            href="https://andresptr.site"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 hover:underline underline-offset-4 min-h-[44px] px-1"
          >
            <span>&copy; {new Date().getFullYear()} Andre Saputra</span>
            <ArrowUpRight
              className="w-3.5 h-3.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </footer>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border-slate-300/90 bg-white/95 backdrop-blur-md p-6 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)]">
          <DialogHeader className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2.5">
              <span
                className="w-9 h-9 rounded-lg border border-blue-200 bg-blue-50/80 flex items-center justify-center text-blue-700 shrink-0"
                aria-hidden="true"
              >
                <Lock className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
                Auth Required
              </span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
              Sign in to upload files
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600">
              Uploads are scoped to authenticated accounts so every file stays private on your
              server until you choose to share it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLoginDialog(false)}
              className="min-h-[44px] border-slate-400/90 text-slate-800 hover:bg-slate-100 hover:text-slate-950"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={goToLogin}
              className="group min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
            >
              <span>Go to Login</span>
              <ArrowRight
                className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;