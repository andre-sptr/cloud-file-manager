import { API_BASE, STORAGE_KEYS } from './constants';
import type { User, LoginResponse, FileData, AuthSession, ApiResponse } from '@/types';

const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  auth: {
    signUp: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to register');
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
        const error = await res.json();
        throw new Error(error.error || 'Failed to login');
      }
      const data = await res.json();
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
        if (!res.ok) throw new Error('Invalid session');
        const data = await res.json();
        return { data: { session: { user: data.user } } };
      } catch (err) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        return { data: { session: null } };
      }
    },
    getUser: async () => {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        return { data: { user: JSON.parse(userStr) as User } };
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
    list: async () => {
      const res = await fetch(`${API_BASE}/files`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    },
    getShared: async (id) => {
      const res = await fetch(`${API_BASE}/files/shared/${id}`);
      if (!res.ok) throw new Error('Failed to fetch shared file');
      return res.json();
    },
    upload: async (files) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      
      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: getAuthHeaders(), 
        body: formData
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload files');
      }
      return res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/files/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete file');
      }
      return res.json();
    }
  }
};
