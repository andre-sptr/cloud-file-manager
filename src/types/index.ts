export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface FileData {
  id: string;
  owner_id?: string;
  folder_id?: string | null;
  name: string;
  type: string;
  size: number;
  url: string;
  is_public?: boolean;
  created_at: string;
}

export interface FolderData {
  id: string;
  owner_id?: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

export interface DeleteFolderResponse {
  message: string;
  deletedFolderIds: string[];
}

export interface AuthSession {
  data: {
    session: {
      user: User;
    } | null;
  };
}

export interface LoginResponse {
  token: string;
  user: Pick<User, 'id' | 'email'>;
}

export interface AuthConfig {
  googleClientId: string | null;
  googleEnabled: boolean;
}