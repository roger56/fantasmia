import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_HOTKEY = '1m0z';
const BUFFER_TIMEOUT_MS = 2000;

/**
 * Global keyboard listener for secret admin access hotkey
 * Listens for a specific key sequence and navigates to /admin/login
 * Does not trigger when typing in input fields
 */
export function useAdminHotkey() {
  const navigate = useNavigate();
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<number | null>(null);
  
  const hotkey = (import.meta.env.VITE_ADMIN_HOTKEY || DEFAULT_HOTKEY).toLowerCase();
  const hotkeyLength = hotkey.length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if focus is on input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore modifier keys and non-printable characters
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key.length !== 1) return;

      // Add character to buffer (lowercase)
      bufferRef.current = (bufferRef.current + event.key.toLowerCase()).slice(-hotkeyLength);

      // Reset timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        bufferRef.current = '';
      }, BUFFER_TIMEOUT_MS);

      // Check for match
      if (bufferRef.current === hotkey) {
        bufferRef.current = '';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        navigate('/admin/login');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate, hotkey, hotkeyLength]);
}
