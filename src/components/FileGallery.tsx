import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  MAX_FOLDER_DEPTH,
  buildFolderStatsMap,
  getFolderBreadcrumbs,
  getFolderDepth,
  validateFolderNameInput,
} from "@/lib/folders";
import type { FileData, FolderData, User } from "@/types";
import { FileCard } from "./FileCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle,
  CornerLeftUp,
  Folder,
  FolderOpen,
  FolderPlus,
  Lock,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface FileGalleryProps {
  user: User | null;
  folders?: FolderData[];
  foldersLoading?: boolean;
  currentFolderId?: string | null;
  refreshKey?: number;
  onNavigateFolder?: (folderId: string | null) => void;
  onCreateFolderRequest?: () => void;
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onUploadRequest?: () => void;
}

interface FolderCardProps {
  folder: FolderData;
  directFolders: number;
  directFiles: number;
  onOpen: (folderId: string) => void;
  onRename: (folder: FolderData) => void;
  onDelete: (folder: FolderData) => void;
}

const FolderCard = ({
  folder,
  directFolders,
  directFiles,
  onOpen,
  onRename,
  onDelete,
}: FolderCardProps) => {
  const summaryParts: string[] = [];
  if (directFolders > 0) {
    summaryParts.push(`${directFolders} ${directFolders === 1 ? "folder" : "folders"}`);
  }
  if (directFiles > 0) {
    summaryParts.push(`${directFiles} ${directFiles === 1 ? "file" : "files"}`);
  }
  const summaryText = summaryParts.length > 0 ? summaryParts.join(" · ") : "Empty folder";

  return (
    <div className="group rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onOpen(folder.id)}
        className="flex flex-1 min-w-0 items-center gap-3.5 text-left rounded-xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
          <Folder className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-slate-900 truncate" title={folder.name}>
            {folder.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{summaryText}</p>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Folder options for ${folder.name}`}
            className="min-h-[36px] min-w-[36px] px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-white border-slate-200">
          <DropdownMenuItem onSelect={() => onOpen(folder.id)} className="cursor-pointer gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Open</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRename(folder)} className="cursor-pointer gap-2">
            <Pencil className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onDelete(folder)}
            className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const FileGallery = ({
  user,
  folders = [],
  foldersLoading = false,
  currentFolderId = null,
  refreshKey = 0,
  onNavigateFolder,
  onCreateFolderRequest,
  onRenameFolder,
  onDeleteFolder,
  onUploadRequest,
}: FileGalleryProps) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [renamingFolder, setRenamingFolder] = useState<FolderData | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const [deletingFolder, setDeletingFolder] = useState<FolderData | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

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
    if (refreshKey >= 0) {
      loadFiles();
    }
    return () => {
      activeRequestRef.current?.abort();
    };
  }, [loadFiles, refreshKey]);

  const handleDeleteFile = async (id: string) => {
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

  const handleMoveFile = async (fileId: string, targetFolderId: string | null) => {
    try {
      const updated = await api.files.move(fileId, targetFolderId);
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, folder_id: updated.folder_id } : file
        )
      );
      const targetName = targetFolderId
        ? folders.find((folder) => folder.id === targetFolderId)?.name || "folder"
        : "All Files (Root)";
      toast.success(`Moved file to ${targetName}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to move file";
      toast.error(message);
    }
  };

  const breadcrumbs = useMemo(
    () => getFolderBreadcrumbs(folders, currentFolderId),
    [folders, currentFolderId]
  );

  const currentFolder = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;
  const parentFolderId = currentFolder ? currentFolder.parent_id : null;
  const currentDepth = getFolderDepth(folders, currentFolderId);
  const canCreateSubfolder = Boolean(user && onCreateFolderRequest && currentDepth < MAX_FOLDER_DEPTH);

  const folderStats = useMemo(
    () => buildFolderStatsMap(folders, files),
    [folders, files]
  );

  const descendantFolderIds = useMemo(() => {
    if (!currentFolderId) return null;
    const childrenByParent = new Map<string, string[]>();
    for (const folder of folders) {
      if (!folder.parent_id) continue;
      const list = childrenByParent.get(folder.parent_id);
      if (list) {
        list.push(folder.id);
      } else {
        childrenByParent.set(folder.parent_id, [folder.id]);
      }
    }

    const ids = new Set<string>([currentFolderId]);
    const queue = [currentFolderId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const children = childrenByParent.get(id) ?? [];
      for (const childId of children) {
        if (!ids.has(childId)) {
          ids.add(childId);
          queue.push(childId);
        }
      }
    }
    return ids;
  }, [folders, currentFolderId]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isFiltering = Boolean(normalizedSearch || filterType !== "all");

  const visibleFolders = useMemo(() => {
    if (filterType !== "all") {
      return [];
    }

    const scoped = normalizedSearch
      ? folders.filter((folder) => {
          const matchesSearch = folder.name.toLowerCase().includes(normalizedSearch);
          if (!matchesSearch) return false;
          if (!descendantFolderIds) return true;
          return folder.id !== currentFolderId && descendantFolderIds.has(folder.id);
        })
      : folders.filter((folder) => (folder.parent_id ?? null) === currentFolderId);

    return [...scoped].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [folders, currentFolderId, normalizedSearch, filterType, descendantFolderIds]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const fileFolderId = file.folder_id ?? null;

      if (isFiltering) {
        if (descendantFolderIds) {
          if (!fileFolderId || !descendantFolderIds.has(fileFolderId)) {
            return false;
          }
        }
      } else if (fileFolderId !== currentFolderId) {
        return false;
      }

      const matchesSearch =
        !normalizedSearch || file.name.toLowerCase().includes(normalizedSearch);
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
  }, [files, currentFolderId, isFiltering, descendantFolderIds, normalizedSearch, filterType]);

  const navigateToFolder = (folderId: string | null) => {
    setSearchTerm("");
    setFilterType("all");
    onNavigateFolder?.(folderId);
  };

  const openRenameDialog = (folder: FolderData) => {
    setRenamingFolder(folder);
    setRenameValue(folder.name);
    setRenameError(null);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFolder || !onRenameFolder || isRenaming) return;

    const validation = validateFolderNameInput(renameValue);
    if (!validation.valid) {
      setRenameError(validation.error || "Invalid folder name");
      return;
    }

    if (validation.value === renamingFolder.name) {
      setRenamingFolder(null);
      return;
    }

    setIsRenaming(true);
    setRenameError(null);
    try {
      await onRenameFolder(renamingFolder.id, validation.value);
      setRenamingFolder(null);
    } catch (error: unknown) {
      setRenameError(error instanceof Error ? error.message : "Failed to rename folder");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDeleteFolder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deletingFolder || !onDeleteFolder || isDeletingFolder) return;
    setIsDeletingFolder(true);
    try {
      await onDeleteFolder(deletingFolder.id);
      setDeletingFolder(null);
    } catch {
      // Error toast is surfaced by the handler; keep modal closed or recoverable
      setDeletingFolder(null);
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const isInitialLoading = loading || (foldersLoading && folders.length === 0);

  if (isInitialLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading files">
        <p className="sr-only">Loading your workspace...</p>
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

  const hasVisibleContent = visibleFolders.length > 0 || filteredFiles.length > 0;
  const isEmptyFolderView = Boolean(user && !isFiltering && !hasVisibleContent);

  return (
    <div className="space-y-6">
      {user && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/85 px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {currentFolderId !== null && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigateToFolder(parentFolderId)}
                aria-label="Go up one folder"
                title="Go up one level"
                className="min-h-[34px] px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shrink-0"
              >
                <CornerLeftUp className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
            <nav aria-label="Breadcrumbs" className="workspace-breadcrumbs min-w-0">
              <ol>
                <li>
                  <a
                    href="#workspace-root"
                    aria-current={currentFolderId === null ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToFolder(null);
                    }}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
                    <span>All Files</span>
                  </a>
                </li>
                {breadcrumbs.map((crumb) => {
                  const isCurrent = crumb.id === currentFolderId;
                  return (
                    <li key={crumb.id} className="max-w-[14rem]">
                      <a
                        href={`#folder-${crumb.id}`}
                        aria-current={isCurrent ? "page" : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToFolder(crumb.id);
                        }}
                        className="truncate max-w-full"
                        title={crumb.name}
                      >
                        <span className="truncate">{crumb.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {onCreateFolderRequest && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateFolderRequest}
              disabled={!canCreateSubfolder}
              title={
                canCreateSubfolder
                  ? "Create folder here"
                  : `Maximum folder depth (${MAX_FOLDER_DEPTH}) reached`
              }
              className="min-h-[36px] border-slate-300 bg-white text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shrink-0"
            >
              <FolderPlus className="w-4 h-4" aria-hidden="true" />
              <span>New Folder</span>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500"
            aria-hidden="true"
          />
          <Input
            aria-label="Search files and folders"
            placeholder={
              currentFolder
                ? `Search in ${currentFolder.name}...`
                : "Search files and folders..."
            }
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
              All Items
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
          <Button
            variant="outline"
            onClick={loadFiles}
            className="min-h-[44px] border-slate-500 text-slate-800 hover:bg-slate-100"
          >
            Retry
          </Button>
        </div>
      ) : !hasVisibleContent ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            {!user ? (
              <Lock className="w-8 h-8 text-slate-600" aria-hidden="true" />
            ) : isFiltering ? (
              <Search className="w-8 h-8 text-slate-600" aria-hidden="true" />
            ) : currentFolder ? (
              <FolderOpen className="w-8 h-8 text-blue-600" aria-hidden="true" />
            ) : (
              <Upload className="w-8 h-8 text-slate-600" aria-hidden="true" />
            )}
          </div>
          <p className="text-lg font-medium text-slate-800 mb-2">
            {!user
              ? "Login to view your files"
              : isFiltering
              ? "No items match your search"
              : currentFolder
              ? "This folder is empty"
              : "No files or folders yet"}
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {!user
              ? "Please login to upload and manage your files"
              : isFiltering
              ? "Try adjusting your search query or file type filter."
              : currentFolder
              ? `Create a subfolder or upload files directly into "${currentFolder.name}".`
              : "Create a folder to organize your workspace or upload your first file."}
          </p>
          {isEmptyFolderView && (onUploadRequest || canCreateSubfolder) && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {canCreateSubfolder && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCreateFolderRequest}
                  className="min-h-[40px] border-slate-300 text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                >
                  <FolderPlus className="w-4 h-4" aria-hidden="true" />
                  <span>New Folder</span>
                </Button>
              )}
              {onUploadRequest && (
                <Button
                  type="button"
                  onClick={onUploadRequest}
                  className="min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>Upload files</span>
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleFolders.length > 0 && (
            <section aria-label="Folders" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-[0.12em] text-slate-500">
                  Folders ({visibleFolders.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleFolders.map((folder) => {
                  const stats = folderStats.get(folder.id);
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      directFolders={stats?.directFolders ?? 0}
                      directFiles={stats?.directFiles ?? 0}
                      onOpen={navigateToFolder}
                      onRename={openRenameDialog}
                      onDelete={setDeletingFolder}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {filteredFiles.length > 0 && (
            <section aria-label="Files" className="space-y-3">
              {(visibleFolders.length > 0 || currentFolder !== null || isFiltering) && (
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-[0.12em] text-slate-500">
                    Files ({filteredFiles.length})
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={() => handleDeleteFile(file.id)}
                    onShareChange={handleShareChange}
                    folders={folders}
                    onMoveToFolder={handleMoveFile}
                    showFolderBadge={isFiltering}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(renamingFolder)}
        onOpenChange={(open) => {
          if (!open && !isRenaming) {
            setRenamingFolder(null);
            setRenameError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Rename Folder</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update the folder name without changing any existing shared file links.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-folder-input" className="text-slate-800">
                Folder name
              </Label>
              <Input
                id="rename-folder-input"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  if (renameError) setRenameError(null);
                }}
                placeholder="e.g., Design Assets"
                maxLength={100}
                autoFocus
                disabled={isRenaming}
                aria-invalid={Boolean(renameError)}
                className="min-h-[42px] bg-white border-slate-300 text-slate-900"
              />
              {renameError && (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {renameError}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenamingFolder(null)}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRenaming}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isRenaming ? "Saving..." : "Save Name"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingFolder)}
        onOpenChange={(open) => {
          if (!open && !isDeletingFolder) {
            setDeletingFolder(null);
          }
        }}
      >
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-semibold text-slate-800">
                {deletingFolder?.name}
              </span>
              ? Any subfolders inside it will also be removed, and files inside will be moved safely back to All Files (Root).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFolder}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteFolder}
              disabled={isDeletingFolder}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeletingFolder ? "Deleting..." : "Delete Folder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
