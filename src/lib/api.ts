import { API_BASE, STORAGE_KEYS } from './constants';
import type { User, LoginResponse, FileData, AuthSession } from '@/types';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // Non-JSON response body (e.g. proxy or gateway error)
  }
  return fallback;
};

export const api = {
  auth: {
    signUp: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'Failed to register'));
      }
      return res.json();
    },
    signInWithPassword: async (email: string, password: string): Promise<LoginResponse> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'Failed to login'));
      }
      const data: LoginResponse = await res.json();
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      return data;
    },
    getSession: async (): Promise<AuthSession> => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return { data: { session: null } };

      try {
        const res = await fetch(`${API_BASE}/auth/session`, {
          headers: getAuthHeaders()
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          return { data: { session: null } };
        }
        if (!res.ok) {
          return { data: { session: null } };
        }
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        }
        return { data: { session: { user: data.user } } };
      } catch {
        return { data: { session: null } };
      }
    },
    getUser: async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        return { data: { user: null } };
      }
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        try {
          return { data: { user: JSON.parse(userStr) as User } };
        } catch {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
      const session = await api.auth.getSession();
      return { data: { user: session.data.session?.user || null } };
    },
    signOut: async () => {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      return { error: null };
    }
  },
  files: {
    list: async (): Promise<FileData[]> => {
      const res = await fetch(`${API_BASE}/files`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to fetch files'));
      return res.json();
    },
    getShared: async (id: string): Promise<FileData> => {
      const res = await fetch(`${API_BASE}/files/shared/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to fetch shared file'));
      return res.json();
    },
    setShare: async (id: string, isPublic: boolean): Promise<{ id: string; is_public: boolean }> => {
      const res = await fetch(`${API_BASE}/files/${encodeURIComponent(id)}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ is_public: isPublic }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'Failed to update share settings'));
      }
      return res.json();
    },
    fetchProtectedContent: async (id: string, download = false, signal?: AbortSignal): Promise<Blob> => {
      const query = download ? '?download=1' : '';
      const res = await fetch(`${API_BASE}/files/${encodeURIComponent(id)}/content${query}`, {
        headers: getAuthHeaders(),
        signal,
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'Failed to load file content'));
      }
      return res.blob();
    },
    upload: (files: File[], onProgress?: (percent: number) => void): Promise<FileData[]> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        for (const file of files) {
          formData.append('files', file);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/files/upload`);

        const authHeaders = getAuthHeaders();
        if (authHeaders.Authorization) {
          xhr.setRequestHeader('Authorization', authHeaders.Authorization);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0 && onProgress) {
            const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          let payload: unknown = null;
          try {
            payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          } catch {
            payload = null;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload as FileData[]);
            return;
          }

          const errorMessage =
            payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
              ? payload.error
              : 'Failed to upload files';
          reject(new Error(errorMessage));
        };

        xhr.onerror = () => {
          reject(new Error('Network error while uploading files'));
        };

        xhr.onabort = () => {
          reject(new Error('Upload was cancelled'));
        };

        xhr.send(formData);
      });
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/files/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'Failed to delete file'));
      }
      return res.json();
    }
  }
};
