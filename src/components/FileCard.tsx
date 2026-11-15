import { useEffect, useState } from "react";
import { Download, Trash2, Share2, Play, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { copyToClipboard, formatFileSize, getFileIcon } from "@/lib/utils";
import type { FileData } from "@/types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface FileCardProps {
  file: FileData;
  onDelete: () => void;
  onShareChange?: (id: string, isPublic: boolean) => void;
}

export const FileCard = ({ file, onDelete, onShareChange }: FileCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isPublic = Boolean(file.is_public);

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setImageError(false);

    api.files
      .fetchProtectedContent(file.id, false, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setImageError(true);
      });

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file.id, isImage]);

  const IconComponent = getFileIcon(file.type);

  const copyShareLink = async () => {
    setIsUpdatingShare(true);
    try {
      if (!isPublic) {
        await api.files.setShare(file.id, true);
        onShareChange?.(file.id, true);
      }

      const shareUrl = `${window.location.origin}/f/${file.id}`;
      const copied = await copyToClipboard(shareUrl);
      if (copied) {
        toast.success(isPublic ? "Share link copied to clipboard!" : "File shared publicly & link copied!");
      } else {
        toast.success(`Public link enabled: ${shareUrl}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to share file";
      toast.error(message);
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const revokeShare = async () => {
    setIsUpdatingShare(true);
    try {
      await api.files.setShare(file.id, false);
      onShareChange?.(file.id, false);
      toast.success("Public access revoked; file is now private");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update share settings";
      toast.error(message);
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const downloadFile = async () => {
    try {
      const blob = await api.files.fetchProtectedContent(file.id, true);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download file";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-slate-200">
      <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
        {isImage && !imageError && previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </>
        ) : isVideo ? (
          <div className="relative w-full h-full bg-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                Video
              </span>
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="w-10 h-10 text-blue-600" />
          </div>
        )}

        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
              isPublic
                ? "bg-blue-600/90 text-white"
                : "bg-slate-900/70 text-white"
            }`}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? "Shared" : "Private"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold truncate mb-1 text-slate-800">{file.name}</h3>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{formatFileSize(file.size)}</span>
            <span>
              {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            onClick={downloadFile}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            disabled={isUpdatingShare}
            aria-label={isPublic ? "Copy share link" : "Share file publicly and copy link"}
            title={isPublic ? "Copy share link" : "Enable public link & copy"}
            className="border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          {isPublic && (
            <Button
              variant="outline"
              size="sm"
              onClick={revokeShare}
              disabled={isUpdatingShare}
              aria-label="Revoke public share link"
              title="Make private"
              className="border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Delete file"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-300"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete File</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800">
                    {file.name}
                  </span>
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
