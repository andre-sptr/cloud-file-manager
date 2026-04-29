import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, File, Image, Video, Cloud, Link as LinkIcon, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const SharedFile = () => {
  const { id } = useParams();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      try {
        const data = await api.files.getShared(id);
        setFile(data);
      } catch (error) {
        console.error("Error loading file:", error);
        toast.error("File not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFile();
    }
  }, [id]);

  const downloadFile = () => {
    if (file) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const getFileIcon = () => {
    if (!file) return File;
    if (file.type.startsWith("image/")) return Image;
    if (file.type.startsWith("video/")) return Video;
    return File;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="w-full max-w-4xl mx-4 p-0 overflow-hidden bg-white border-slate-200">
          <Skeleton className="aspect-video bg-slate-200" />
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-3/4 bg-slate-200" />
            <Skeleton className="h-4 w-1/2 bg-slate-200" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 flex-1 bg-slate-200" />
              <Skeleton className="h-12 w-32 bg-slate-200" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Card className="p-8 text-center max-w-md bg-white border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <File className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-800">
            File Not Found
          </h1>
          <p className="text-slate-500 mb-6">
            The file you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link to="/">Go to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const IconComponent = getFileIcon();
  const isImage = file.type.startsWith("image/") && !imageError;
  const isVideo = file.type.startsWith("video/");

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                VPS File Hub
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto overflow-hidden bg-white border-slate-200">
          <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
            {isImage ? (
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-contain animate-in fade-in duration-300"
                onError={() => setImageError(true)}
              />
            ) : isVideo ? (
              <video
                src={file.url}
                controls
                className="w-full h-full"
                poster={file.thumbnail || undefined}
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-24 h-24 rounded-3xl bg-blue-100 flex items-center justify-center">
                  <IconComponent className="w-12 h-12 text-blue-600" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-800 break-words">
                {file.name}
              </h1>
              <p className="text-slate-500">
                {formatSize(file.size)} &bull; {file.type}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={downloadFile}
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Download File
              </Button>
              <Button
                onClick={copyLink}
                variant="outline"
                size="lg"
                className="border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                Copy Link
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                Shared via VPS File Hub &bull; Secure local hosting
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SharedFile;