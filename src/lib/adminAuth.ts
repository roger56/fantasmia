/**
 * Admin Authentication Module
 * Handles login, session check, and logout via Vercel API
 * Uses httpOnly cookies for secure session management
 */

const ADMIN_LOGIN_URL = import.meta.env.VITE_ADMIN_LOGIN_URL || 'https://fantasmia-ai.vercel.app/api/admin/login';
const ADMIN_ME_URL = import.meta.env.VITE_ADMIN_ME_URL || 'https://fantasmia-ai.vercel.app/api/admin/me';
const ADMIN_LOGOUT_URL = import.meta.env.VITE_ADMIN_LOGOUT_URL || 'https://fantasmia-ai.vercel.app/api/admin/logout';

/**
 * Authenticate admin user with password
 * @param password - Admin password
 * @throws Error if authentication fails
 */
export async function adminLogin(password: string): Promise<void> {
  const response = await fetch(ADMIN_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password })
  });
  
  if (!response.ok) {
    let errorMessage = 'Errore di autenticazione';
    try {
      const text = await response.text();
      const data = JSON.parse(text);
      errorMessage = data.error || errorMessage;
    } catch {
      // Keep default error message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Check if admin session is valid
 * @returns true if authenticated, false otherwise
 */
export async function adminCheck(): Promise<boolean> {
  try {
    const response = await fetch(ADMIN_ME_URL, {
      method: 'GET',
      credentials: 'include'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Logout admin user (invalidate session cookie)
 */
export async function adminLogout(): Promise<void> {
  await fetch(ADMIN_LOGOUT_URL, {
    method: 'POST',
    credentials: 'include'
  });
}
