import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { copyToClipboard, formatFileSize, getFileIcon } from "@/lib/utils";
import type { FileData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, File, Cloud, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const SharedFile = () => {
  const { id } = useParams();
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) {
      setFile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFile(null);
    setImageError(false);

    const loadFile = async (fileId: string) => {
      try {
        const data = await api.files.getShared(fileId);
        if (!cancelled) {
          setFile(data);
        }
      } catch (error) {
        console.error("Error loading file:", error);
        if (!cancelled) {
          toast.error("File not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFile(id);

    return () => {
      cancelled = true;
    };
  }, [id]);

  const downloadFile = () => {
    if (file) {
      const link = document.createElement("a");
      const separator = file.url.includes("?") ? "&" : "?";
      link.href = `${file.url}${separator}download=1`;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyLink = async () => {
    const copied = await copyToClipboard(window.location.href);
    if (copied) {
      toast.success("Link copied to clipboard!");
    } else {
      toast.error("Failed to copy link to clipboard");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center app-page-canvas" role="status" aria-label="Loading shared file">
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
      </main>
    );
  }

  if (!file) {
    return (
      <main className="min-h-screen flex items-center justify-center app-page-canvas p-4">
        <Card className="p-8 text-center max-w-md bg-white border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <File className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-800">
            File Not Found
          </h1>
          <p className="text-slate-600 mb-6">
            The file you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="min-h-[44px]">
            <Link to="/">Go to Home</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const IconComponent = getFileIcon(file.type);
  const isImage = file.type.startsWith("image/") && !imageError;
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  return (
    <div className="min-h-screen app-page-canvas">
      <header className="border-b border-slate-200/90 bg-white/85 backdrop-blur-md sticky top-0 z-40">
        <nav aria-label="Primary" className="container mx-auto px-4">
          <div className="flex items-center gap-2 min-h-16 py-2">
            <Link to="/" className="inline-flex items-center gap-2.5 min-h-[44px] hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
                <Cloud className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                VPS File Hub
              </span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto overflow-hidden bg-white border-slate-200 shadow-lg shadow-slate-900/5">
          <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
            {isImage ? (
              <img
                src={file.url}
                alt={file.name}
                width={1280}
                height={720}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : isVideo ? (
              <video
                src={file.url}
                controls
                width={1280}
                height={720}
                className="w-full h-full"
              >
                <track kind="captions" />
              </video>
            ) : isAudio ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 w-full max-w-md">
                <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center">
                  <IconComponent className="w-10 h-10 text-blue-600" aria-hidden="true" />
                </div>
                <audio controls src={file.url} className="w-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-24 h-24 rounded-3xl bg-blue-100 flex items-center justify-center">
                  <IconComponent className="w-12 h-12 text-blue-600" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 break-words">
                {file.name}
              </h1>
              <p className="text-slate-600">
                {formatFileSize(file.size, 2)} &bull; {file.type}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={downloadFile}
                size="lg"
                className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
              >
                <Download aria-hidden="true" />
                Download File
              </Button>
              <Button
                onClick={copyLink}
                variant="outline"
                size="lg"
                className="min-h-[44px] border-slate-500 text-slate-800 hover:bg-blue-50 hover:border-blue-600"
              >
                <LinkIcon aria-hidden="true" />
                Copy Link
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 text-center">
                Shared via VPS File Hub &bull; Self-hosted file hosting
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SharedFile;