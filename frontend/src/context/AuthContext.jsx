import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bij het laden: check of er een opgeslagen sessie is
  useEffect(() => {
    const storedUser = localStorage.getItem('sportportal_user');
    const storedToken = localStorage.getItem('sportportal_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('sportportal_user');
        localStorage.removeItem('sportportal_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('sportportal_token', data.token);
    localStorage.setItem('sportportal_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await apiClient.post('/auth/register', { name, email, password });
    localStorage.setItem('sportportal_token', data.token);
    localStorage.setItem('sportportal_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sportportal_token');
    localStorage.removeItem('sportportal_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth moet binnen een AuthProvider worden gebruikt');
  }
  return context;
}
