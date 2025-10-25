import { createContext, useContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../../config/auth';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (userData) => {
    try {
      // Check if user exists in backend and get their role
      const response = await fetch('http://localhost:3001/api/users/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          googleId: userData.id,
          name: userData.name,
          picture: userData.picture,
          username: userData.username,
        }),
      });

      const userWithRole = await response.json();
      
      // Combine Google data with backend role data
      const enrichedUserData = {
        ...userData,
        isModerator: userWithRole.isModerator || false,
        roles: userWithRole.roles || ['user'],
      };

      setUser(enrichedUserData);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(enrichedUserData));
      return enrichedUserData;
    } catch (error) {
      console.error('Failed to authenticate with backend:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_user');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}