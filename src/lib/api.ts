// Client-side API wrapper for custom backend

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
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
    signInWithPassword: async (email, password) => {
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    },
    getSession: async () => {
      const token = localStorage.getItem('token');
      if (!token) return { data: { session: null } };
      
      try {
        const res = await fetch(`${API_BASE}/auth/session`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Invalid session');
        const data = await res.json();
        return { data: { session: { user: data.user } } };
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { data: { session: null } };
      }
    },
    getUser: async () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return { data: { user: JSON.parse(userStr) } };
      }
      const session = await api.auth.getSession();
      return { data: { user: session.data.session?.user || null } };
    },
    signOut: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
        headers: getAuthHeaders(), // Don't set Content-Type, let browser set it for FormData
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
