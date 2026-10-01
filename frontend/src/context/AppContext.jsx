import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  // Auth State
  const [user, setUser] = useState({ id: 1, username: 'default_user', email: 'default@example.com', role: 'admin' });
  const [token, setToken] = useState(() => localStorage.getItem('token') || 'mocked-token-for-direct-access');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  // Active Video State for Summary/Highlights/Chat pages
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Settings state
  const [appSettings, setAppSettings] = useState({
    summaryLength: 'medium',
    highlightStyle: 'Podcast',
    language: 'English',
    aiModel: 'Gemini'
  });

  // Base API configuration (supports VITE_API, VITE, or VITE_API_URL)
  const API_URL = import.meta.env.VITE_API || import.meta.env.VITE || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load User on Mount or Token change
  useEffect(() => {
    const fetchUser = async () => {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_URL}/auth/me`);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to sync auth with backend:', err);
        // Fallback to default user to allow direct access even if backend is starting/offline
        setUser({ id: 1, username: 'default_user', email: 'default@example.com', role: 'admin' });
        setIsAuthenticated(true);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [token]);

  // Notification helper
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Auth Actions
  const login = async (username, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      const response = await axios.post(`${API_URL}/auth/login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      addNotification('Welcome back! Login successful.', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check credentials.';
      addNotification(msg, 'error');
      return false;
    }
  };

  const signup = async (username, email, password) => {
    try {
      await axios.post(`${API_URL}/auth/signup`, { username, email, password });
      addNotification('Account created successfully! Please login.', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Signup failed. Username or email may exist.';
      addNotification(msg, 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setSelectedVideo(null);
    delete axios.defaults.headers.common['Authorization'];
    addNotification('Logged out successfully.', 'info');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateSettings = (newSettings) => {
    setAppSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      addNotification('Preferences updated.', 'success');
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        token,
        isAuthenticated,
        loadingUser,
        login,
        signup,
        logout,
        notifications,
        addNotification,
        removeNotification,
        selectedVideo,
        setSelectedVideo,
        appSettings,
        updateSettings,
        API_URL
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
