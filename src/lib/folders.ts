import type { FileData, FolderData } from "@/types";

export const MAX_FOLDER_NAME_LENGTH = 100;
export const MAX_FOLDER_DEPTH = 10;

export interface FolderOption {
  folder: FolderData;
  depth: number;
  path: string;
}

export interface FolderStats {
  directFolders: number;
  directFiles: number;
}

const hasControlCharacters = (value: string): boolean => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
};

/**
 * Validates and normalizes a folder name matching the backend rules.
 */
export const validateFolderNameInput = (
  rawName: string
): { valid: boolean; value: string; error?: string } => {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { valid: false, value: "", error: "Folder name cannot be empty" };
  }
  if (trimmed.length > MAX_FOLDER_NAME_LENGTH) {
    return {
      valid: false,
      value: trimmed,
      error: `Folder name must be at most ${MAX_FOLDER_NAME_LENGTH} characters`,
    };
  }
  if (
    trimmed === "." ||
    trimmed === ".." ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    hasControlCharacters(trimmed)
  ) {
    return {
      valid: false,
      value: trimmed,
      error: "Folder name cannot contain slashes or control characters",
    };
  }
  return { valid: true, value: trimmed };
};

/**
 * Computes 1-based depth for a folder (Root children have depth 1).
 */
export const getFolderDepth = (
  folders: FolderData[],
  folderId: string | null
): number => {
  if (!folderId) return 0;
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const visited = new Set<string>();
  let depth = 0;
  let currentId: string | null = folderId;

  while (currentId) {
    if (visited.has(currentId) || depth > MAX_FOLDER_DEPTH + 1) {
      break;
    }
    visited.add(currentId);
    const folder = byId.get(currentId);
    if (!folder) break;
    depth += 1;
    currentId = folder.parent_id;
  }

  return depth;
};

/**
 * Returns the ordered ancestor chain ending at folderId.
 */
export const getFolderBreadcrumbs = (
  folders: FolderData[],
  folderId: string | null
): FolderData[] => {
  if (!folderId) return [];
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const visited = new Set<string>();
  const trail: FolderData[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const folder = byId.get(currentId);
    if (!folder) break;
    trail.unshift(folder);
    currentId = folder.parent_id;
  }

  return trail;
};

/**
 * Builds hierarchically ordered folder options with full slash-delimited paths.
 */
export const buildFolderOptions = (folders: FolderData[]): FolderOption[] => {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const childrenByParent = new Map<string | null, FolderData[]>();

  for (const folder of folders) {
    const parentKey =
      folder.parent_id && byId.has(folder.parent_id) ? folder.parent_id : null;
    const list = childrenByParent.get(parentKey);
    if (list) {
      list.push(folder);
    } else {
      childrenByParent.set(parentKey, [folder]);
    }
  }

  for (const list of childrenByParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }

  const options: FolderOption[] = [];
  const visited = new Set<string>();

  const walk = (parentId: string | null, depth: number, prefix: string) => {
    const children = childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      const path = prefix ? `${prefix} / ${child.name}` : child.name;
      options.push({ folder: child, depth, path });
      walk(child.id, depth + 1, path);
    }
  };

  walk(null, 0, "");
  return options;
};

/**
 * Counts direct subfolders and files inside each folder.
 */
export const buildFolderStatsMap = (
  folders: FolderData[],
  files: FileData[]
): Map<string, FolderStats> => {
  const stats = new Map<string, FolderStats>();

  const ensure = (folderId: string): FolderStats => {
    let entry = stats.get(folderId);
    if (!entry) {
      entry = { directFolders: 0, directFiles: 0 };
      stats.set(folderId, entry);
    }
    return entry;
  };

  for (const folder of folders) {
    ensure(folder.id);
    if (folder.parent_id) {
      ensure(folder.parent_id).directFolders += 1;
    }
  }

  for (const file of files) {
    if (file.folder_id) {
      ensure(file.folder_id).directFiles += 1;
    }
  }

  return stats;
};
