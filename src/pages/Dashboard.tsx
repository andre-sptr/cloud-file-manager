import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await api.auth.getSession();

        if (session && session.user) {
          setUser(session.user);
        }
        // Jika belum login, tetap tampilkan halaman publik (tidak redirect)
      } catch (err) {
        // Error, tetap tampilkan halaman publik
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const scrollToUpload = () => {
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <Hero onUploadClick={scrollToUpload} onLearnMoreClick={scrollToFeatures} />

      <Features />

      <section
        id="dashboard"
        className="py-24 bg-slate-50"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <h2 className="text-4xl font-bold mb-4 text-slate-800">
                VPS File Manager
              </h2>
              <p className="text-xl text-slate-600">
                Upload, manage, and share your files securely on your server
              </p>
            </div>

            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-slate-100 p-1">
                <TabsTrigger
                  value="gallery"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600"
                >
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="animate-in fade-in duration-300">
                <FileGallery />
              </TabsContent>

              <TabsContent value="upload" className="animate-in fade-in duration-300">
                <div className="max-w-3xl mx-auto">
                  <FileUpload
                    onUploadComplete={() => {
                      const galleryTab = document.querySelector(
                        '[value="gallery"]'
                      ) as HTMLElement;
                      galleryTab?.click();
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            <a
              href="https://andresptr.site"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline underline-offset-4"
            >
              &copy; {new Date().getFullYear()} Andre Saputra
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;