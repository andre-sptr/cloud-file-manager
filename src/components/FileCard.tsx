import { useState } from "react";
import { Download, Trash2, Share2, File, Image, Video, Play } from "lucide-react";
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
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

interface FileCardProps {
  file: FileData;
  onDelete: () => void;
}

export const FileCard = ({ file, onDelete }: FileCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getFileIcon = () => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.startsWith("video/")) return Video;
    return File;
  };

  const IconComponent = getFileIcon();

  const copyShareLink = () => {
    navigator.clipboard.writeText(file.url);
    toast.success("Share link copied to clipboard!");
  };

  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/50 bg-card">
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {isImage && !imageError ? (
          <>
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </>
        ) : isVideo ? (
          <div className="relative w-full h-full bg-muted flex items-center justify-center">
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
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="w-10 h-10 text-primary" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold truncate mb-1 text-card-foreground">{file.name}</h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatSize(file.size)}</span>
            <span>
              {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={downloadFile}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Share2 className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete File</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {file.name}
                  </span>
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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