import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, subscribeAuthCleared } from "@/lib/api";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";

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
        const { data: { session } } = await api.auth.getSession();

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

  const getScrollBehavior = (): ScrollBehavior =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

  const scrollToUpload = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setActiveTab("upload");
    document.getElementById("dashboard")?.scrollIntoView({ behavior: getScrollBehavior() });
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: getScrollBehavior() });
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
        className="min-h-screen flex flex-col items-center justify-center gap-3 app-page-canvas"
        role="status"
      >
        <div
          className="app-spinner rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-600">Checking session...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
            className="py-14 sm:py-20"
          >
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 sm:mb-12">
                  <h2 id="dashboard-heading" className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900">
                    VPS File Manager
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600">
                    Upload, manage, and share your files securely on your server
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white border border-slate-500 p-1 min-h-[48px]">
                    <TabsTrigger
                      value="gallery"
                      className="min-h-[38px] text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      Gallery
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="min-h-[38px] text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="gallery">
                    <FileGallery user={user} />
                  </TabsContent>

                  <TabsContent value="upload">
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

      <footer className="border-t border-slate-200 py-6 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-600">
            <a
              href="https://andresptr.site"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline underline-offset-4 inline-flex items-center min-h-[44px] px-2"
            >
              &copy; {new Date().getFullYear()} Andre Saputra
            </a>
          </p>
        </div>
      </footer>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to login to upload files. Please login or register to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={goToLogin} className="w-full min-h-[44px]">
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;