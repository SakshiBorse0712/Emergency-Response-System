import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, config);
          setUser({ ...data, token });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, { email, password });
    localStorage.setItem('token', data.token);
    
    // Fetch full profile immediately
    const config = { headers: { Authorization: `Bearer ${data.token}` } };
    const profile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, config);
    setUser({ ...profile.data, token: data.token });
  };

  const register = async (userData) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, userData);
    localStorage.setItem('token', data.token);
    
    // Fetch full profile immediately
    const config = { headers: { Authorization: `Bearer ${data.token}` } };
    const profile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, config);
    setUser({ ...profile.data, token: data.token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
