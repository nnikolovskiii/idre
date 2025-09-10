import { getAuthUrl } from './api';

// Type definitions
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface UserInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Auth service functions
export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ access_token: string; token_type: string }> => {
    const response = await fetch(getAuthUrl('LOGIN'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    const response = await fetch(getAuthUrl('REGISTER'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Registration failed: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  logout: async (): Promise<void> => {
    const response = await fetch(getAuthUrl('LOGOUT'), {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Logout failed: ${response.statusText} (${errorText})`);
    }
  },

  getMe: async (): Promise<User> => {
    const response = await fetch(getAuthUrl('ME'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user info: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  getUserInfo: async (): Promise<UserInfo> => {
    const response = await fetch(getAuthUrl('GET_USER_INFO'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user info: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  addUserInfo: async (userInfo: UserInfo): Promise<UserInfo> => {
    const response = await fetch(getAuthUrl('ADD_USER_INFO'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add user info: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  hasUserInfo: async (): Promise<boolean> => {
    const response = await fetch(getAuthUrl('HAS_USER_INFO'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to check user info: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },
};
