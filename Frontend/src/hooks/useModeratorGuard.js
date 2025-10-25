import { useAuth } from '../components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function useModeratorGuard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    if (!user?.isModerator) {
      navigate('/chat');
    }
  }, [isAuthenticated, user, navigate]);

  return user?.isModerator || false;
}