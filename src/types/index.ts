export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface FileData {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
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

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  owner_id: string;
}