import React, { createContext, useContext, useState, useEffect } from 'react';
import {User} from "@/model/user.ts";
import {LoginRequest} from "@/model/login-request.ts";
import { AuthService } from '@/lib/auth.service';
import {setLogoutHandler} from '@/lib/axios.config.ts';
import {useNavigate} from 'react-router-dom';
import {LoginResponse} from "@/model/login-response.ts";

interface AuthContextType {
  principal: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  oAuthLogin: (request: {provider: 'google' | 'facebook', token: string}) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLogoutHandler(logout);

    // Check for stored token and user data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (response: LoginResponse) => {
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials);
      handleLoginSuccess(response);
    } finally {
      setLoading(false);
    }
  };

  const oAuthLogin = async (request: {provider: 'google' | 'facebook', token: string}) => {
    try {
      setLoading(true);
      const response = await AuthService.oAuthLogin(request);
      handleLoginSuccess(response);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoading(false);
    navigate('/');
  };

  const value = {
    principal: user,
    token,
    isAuthenticated: !!token,
    login,
    oAuthLogin,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
