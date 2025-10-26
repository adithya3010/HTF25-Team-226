import { useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';

export default function Login() {
  const { login } = useAuth();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual client ID
        callback: handleCredentialResponse
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' }
      );
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userData = {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name,
        picture: payload.picture,
        username: payload.email.split('@')[0] // Use email prefix as username
      };

      await login(userData);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login to ChatRoom</h2>
        <div id="google-signin-button" className="flex justify-center"></div>
      </div>
    </div>
  );
}