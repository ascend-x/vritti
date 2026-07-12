import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function useIdleTimeout(timeoutMinutes = 15) {
  const { clearAuth, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        clearAuth();
        navigate('/login');
        toast('Logged out due to inactivity for security reasons', { icon: '🔒' });
      }, timeoutMinutes * 60 * 1000);
    };

    // Listen for any user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [clearAuth, navigate, user, timeoutMinutes]);
}
