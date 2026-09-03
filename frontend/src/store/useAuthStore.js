import { create } from 'zustand';
import { registerUser, loginUser, fetchMe } from '../services/api';

const TOKEN_KEY = 'workflow_auth_token';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize and verify stored token on app boot
  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await fetchMe();
      if (data.status === 'success' && data.user) {
        set({
          user: data.user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Login action
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginUser(credentials);
      if (data.status === 'success' && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }
      throw new Error(data.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Invalid email or password';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Register action
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerUser(userData);
      if (data.status === 'success' && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }
      throw new Error(data.message || 'Registration failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Logout action
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
