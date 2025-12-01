import { apiPost, apiGet } from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'dosen' | 'mahasiswa';
  profile?: any;
  lastLogin?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/login', credentials);
    if (response.success && response.data) {
      // Store token and user info
      localStorage.setItem('access_token', response.data.token);
      localStorage.setItem('user_info', JSON.stringify(response.data.user));
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiPost('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
    }

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiGet<User>('/auth/me');
    if (response.success && response.data) {
      // Update stored user info
      localStorage.setItem('user_info', JSON.stringify(response.data));
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user info');
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiPut('/auth/password', {
      currentPassword,
      newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update password');
    }
  },

  // Get stored user info
  getStoredUser: (): User | null => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    const user = authService.getStoredUser();
    return !!(token && user);
  },

  // Get user role
  getUserRole: (): string | null => {
    const user = authService.getStoredUser();
    return user ? user.role : null;
  },

  // Check if user has specific role
  hasRole: (role: string | string[]): boolean => {
    const userRole = authService.getUserRole();
    if (!userRole) return false;

    if (Array.isArray(role)) {
      return role.includes(userRole);
    }

    return userRole === role;
  },
};