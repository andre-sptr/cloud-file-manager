import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileCard } from "./FileCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload, Lock } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

export const FileGallery = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadFiles = async () => {
    try {
      const data = await api.files.list();
      setFiles(data || []);
      setIsLoggedIn(true);
    } catch (error: any) {
      console.error("Error loading files:", error);
      setIsLoggedIn(false);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (id: string, url: string) => {
    try {
      await api.files.delete(id);
      toast.success("File deleted successfully");
      loadFiles();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (filterType === "image" && file.type.startsWith("image/")) ||
      (filterType === "video" && file.type.startsWith("video/")) ||
      (filterType === "document" &&
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/"));

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1 bg-slate-200" />
          <Skeleton className="h-10 w-48 bg-slate-200" />
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300 text-slate-700 focus:ring-blue-500 focus:border-blue-500">
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
            <SelectItem value="document" className="focus:bg-blue-50 focus:text-blue-700">
              Documents
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            {!isLoggedIn ? (
              <Lock className="w-10 h-10 text-slate-400" />
            ) : files.length === 0 ? (
              <Upload className="w-10 h-10 text-slate-400" />
            ) : (
              <Search className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <p className="text-lg font-medium text-slate-700 mb-2">
            {!isLoggedIn ? "Login to view your files" : files.length === 0 ? "No files uploaded yet" : "No files match your search"}
          </p>
          <p className="text-sm text-slate-500">
            {!isLoggedIn
              ? "Please login to upload and manage your files"
              : files.length === 0
              ? "Start by uploading your first file!"
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file, index) => (
            <div
              key={file.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <FileCard file={file} onDelete={() => handleDelete(file.id, file.url)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};