import { createContext, useContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../../config/auth';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(false);
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
      
      if (!userWithRole._id) {
        console.error('Server response missing _id:', userWithRole);
        throw new Error('Invalid server response: missing _id');
      }

      // Combine backend data with additional Google data
      const enrichedUserData = {
        ...userWithRole, // Keep all the backend data (includes _id)
        accessToken: userData.accessToken, // Add any additional Google data we want to keep
      };

      console.log('Setting user data:', enrichedUserData);

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

  const updateUser = async (updates) => {
    try {
      console.log('Current user:', user);
      // Use either MongoDB _id or Google id
      const userId = user?._id || user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      console.log('Updating user with ID:', userId);
      console.log('Update payload:', updates);
      
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update user' }));
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUserData = await response.json();
      const enrichedUserData = {
        ...user,
        ...updatedUserData,
      };

      setUser(enrichedUserData);
      localStorage.setItem('auth_user', JSON.stringify(enrichedUserData));
      return enrichedUserData;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}