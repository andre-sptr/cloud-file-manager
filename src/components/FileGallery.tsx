import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileCard } from "./FileCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload } from "lucide-react";
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

  const loadFiles = async () => {
    try {
      const data = await api.files.list();
      setFiles(data || []);
    } catch (error: any) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
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
          <Skeleton className="h-10 flex-1 bg-muted" />
          <Skeleton className="h-10 w-48 bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video bg-muted rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted" />
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 bg-background border-input text-foreground focus:ring-primary focus:border-primary">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-popover-foreground">
            <SelectItem value="all" className="focus:bg-accent focus:text-accent-foreground">
              All Files
            </SelectItem>
            <SelectItem value="image" className="focus:bg-accent focus:text-accent-foreground">
              Images
            </SelectItem>
            <SelectItem value="video" className="focus:bg-accent focus:text-accent-foreground">
              Videos
            </SelectItem>
            <SelectItem value="document" className="focus:bg-accent focus:text:text-accent-foreground">
              Documents
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-muted/30 rounded-2xl border border-border">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            {files.length === 0 ? (
              <Upload className="w-10 h-10 text-muted-foreground" />
            ) : (
              <Search className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            {files.length === 0 ? "No files uploaded yet" : "No files match your search"}
          </p>
          <p className="text-sm text-muted-foreground">
            {files.length === 0
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