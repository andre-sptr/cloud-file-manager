import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { FileData, User } from "@/types";
import { FileCard } from "./FileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface FileGalleryProps {
  user: User | null;
}

export const FileGallery = ({ user }: FileGalleryProps) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const activeRequestRef = useRef<AbortController | null>(null);

  const loadFiles = useCallback(async () => {
    activeRequestRef.current?.abort();

    if (!user) {
      activeRequestRef.current = null;
      setFiles([]);
      setFetchError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api.files.list(controller.signal);
      if (activeRequestRef.current === controller) {
        setFiles(data || []);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (activeRequestRef.current === controller) {
        console.error("Error loading files:", error);
        const message = error instanceof Error ? error.message : "Failed to load files";
        setFetchError(message);
        setFiles([]);
      }
    } finally {
      if (activeRequestRef.current === controller) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadFiles();
    return () => {
      activeRequestRef.current?.abort();
    };
  }, [loadFiles]);

  const handleDelete = async (id: string) => {
    try {
      await api.files.delete(id);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      toast.success("File deleted successfully");
    } catch (error: unknown) {
      console.error("Delete error:", error);
      const message = error instanceof Error ? error.message : "Failed to delete file";
      toast.error(message);
    }
  };

  const handleShareChange = (id: string, isPublic: boolean) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, is_public: isPublic } : file))
    );
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (filterType === "image" && file.type.startsWith("image/")) ||
      (filterType === "video" && file.type.startsWith("video/")) ||
      (filterType === "audio" && file.type.startsWith("audio/")) ||
      (filterType === "document" &&
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/") &&
        !file.type.startsWith("audio/"));

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading files">
        <p className="sr-only">Loading your files...</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-11 flex-1 bg-slate-200" />
          <Skeleton className="h-11 w-full sm:w-48 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video bg-slate-200 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-slate-200" />
                <Skeleton className="h-4 w-1/2 bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
          <Input
            aria-label="Search files"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-[44px] pl-10 bg-white border-slate-500 text-slate-900 placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-600"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            aria-label="Filter files by type"
            className="min-h-[44px] w-full sm:w-48 bg-white border-slate-500 text-slate-800 focus:ring-blue-500 focus:border-blue-600"
          >
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-700">
            <SelectItem value="all" className="focus:bg-blue-50 focus:text-blue-700">
              All Files
            </SelectItem>
            <SelectItem value="image" className="focus:bg-blue-50 focus:text-blue-700">
              Images
            </SelectItem>
            <SelectItem value="video" className="focus:bg-blue-50 focus:text-blue-700">
              Videos
            </SelectItem>
            <SelectItem value="audio" className="focus:bg-blue-50 focus:text-blue-700">
              Audio
            </SelectItem>
            <SelectItem value="document" className="focus:bg-blue-50 focus:text-blue-700">
              Documents
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {fetchError ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-800 mb-1">
              Unable to load your files
            </p>
            <p className="text-sm text-slate-600">{fetchError}</p>
          </div>
          <Button variant="outline" onClick={loadFiles} className="min-h-[44px] border-slate-500 text-slate-800 hover:bg-slate-100">
            Retry
          </Button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            {!user ? (
              <Lock className="w-8 h-8 text-slate-600" aria-hidden="true" />
            ) : files.length === 0 ? (
              <Upload className="w-8 h-8 text-slate-600" aria-hidden="true" />
            ) : (
              <Search className="w-8 h-8 text-slate-600" aria-hidden="true" />
            )}
          </div>
          <p className="text-lg font-medium text-slate-800 mb-2">
            {!user ? "Login to view your files" : files.length === 0 ? "No files uploaded yet" : "No files match your search"}
          </p>
          <p className="text-sm text-slate-600">
            {!user
              ? "Please login to upload and manage your files"
              : files.length === 0
              ? "Start by uploading your first file!"
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => handleDelete(file.id)}
              onShareChange={handleShareChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
