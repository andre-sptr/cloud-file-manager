import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { MAX_FILES_UPLOAD, MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { formatFileSize, getFileIcon } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadComplete: () => void;
}

export const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    for (const rejection of fileRejections) {
      const reason = rejection.errors.map((e) => e.message).join(", ");
      toast.error(`${rejection.file.name}: ${reason}`);
    }

    const validFiles = acceptedFiles.filter((file) => {
      const isValid = file.size <= MAX_FILE_SIZE;
      if (!isValid) {
        toast.error(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    setFiles((prev) => {
      const remainingSlots = MAX_FILES_UPLOAD - prev.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES_UPLOAD} files per upload`);
        return prev;
      }
      if (validFiles.length > remainingSlots) {
        toast.error(`Maximum ${MAX_FILES_UPLOAD} files per upload; extra files were skipped`);
        return [...prev, ...validFiles.slice(0, remainingSlots)];
      }
      return [...prev, ...validFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    const uploadCount = files.length;
    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await api.auth.getUser();
      if (!user) {
        toast.error("Please login to upload files");
        return;
      }

      await api.files.upload(files, (percent) => {
        if (mountedRef.current) {
          setUploadProgress(percent);
        }
      });

      if (!mountedRef.current) return;

      setUploadProgress(100);
      toast.success(`${uploadCount} file(s) uploaded successfully!`);
      setFiles([]);
      onUploadComplete();
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Failed to upload files";
      toast.error(message);
    } finally {
      if (mountedRef.current) {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 backdrop-blur-sm
          ${isDragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold mb-2 text-slate-700">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-slate-500">
              or click to browse • Max {MAX_FILE_SIZE_MB}MB per file • Up to {MAX_FILES_UPLOAD} files
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Supports: Images, MP4/WebM, MP3/WAV, PDF, TXT, CSV, JSON, ZIP
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700">Selected Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => {
              const IconComponent = getFileIcon(file.type);
              const fileKey = `${file.name}-${file.size}-${file.lastModified}-${index}`;
              return (
                <div
                  key={fileKey}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-slate-700">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(file.size, 2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-slate-200" />
            </div>
          )}

          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
            size="lg"
          >
            {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
          </Button>
        </div>
      )}
    </div>
  );
};
