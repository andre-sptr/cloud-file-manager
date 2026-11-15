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
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="border-t border-slate-300/80 pt-12 sm:pt-16">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600 mb-3">
                        02 / Workspace
                      </p>
                      <h2
                        id="dashboard-heading"
                        className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950"
                      >
                        VPS File Manager
                      </h2>
                      <p className="mt-2 text-sm sm:text-base text-slate-600">
                        Upload, manage, and share your files securely on your server.
                      </p>
                    </div>

                    <TabsList className="grid w-full md:w-auto md:min-w-[260px] grid-cols-2 bg-white border border-slate-500 p-1 min-h-[48px] rounded-md shrink-0">
                      <TabsTrigger
                        value="gallery"
                        className="min-h-[38px] text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
                      >
                        Gallery
                      </TabsTrigger>
                      <TabsTrigger
                        value="upload"
                        className="min-h-[38px] text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
                      >
                        Upload
                      </TabsTrigger>
                    </TabsList>
                  </div>

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

      <footer className="border-t border-slate-200 py-5 bg-white">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">VPS File Hub</span>
          <a
            href="https://andresptr.site"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 hover:underline underline-offset-4 inline-flex items-center min-h-[44px] px-1"
          >
            &copy; {new Date().getFullYear()} Andre Saputra
          </a>
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