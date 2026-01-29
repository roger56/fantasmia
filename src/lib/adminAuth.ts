/**
 * Admin Authentication Module
 * Handles login, session check, and logout via Vercel API
 * Uses JWT Bearer token for API authentication
 */

const ADMIN_LOGIN_URL = import.meta.env.VITE_ADMIN_LOGIN_URL || 'https://fantasmia-ai.vercel.app/api/admin/login';
const ROOMS_API_URL = 'https://fantasmia-ai.vercel.app/api/admin/rooms';

const ADMIN_TOKEN_KEY = 'admin_jwt_token';

/**
 * Get admin JWT token from sessionStorage
 */
export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

/**
 * Clear admin JWT token from sessionStorage
 */
export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Authenticate admin user with password
 * @param password - Admin password
 * @throws Error if authentication fails
 */
export async function adminLogin(password: string): Promise<void> {
  const response = await fetch(ADMIN_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  
  // Save JWT token from response
  try {
    const data = await response.json();
    if (data.token) {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    }
  } catch {
    // Response without JSON body - maintain backward compatibility
  }
}

/**
 * Check if admin session is valid using action="status" on /rooms API
 * @returns true if authenticated, false otherwise
 */
export async function adminCheck(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'status' })
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Logout admin user (clear token only - no API call needed)
 */
export async function adminLogout(): Promise<void> {
  clearAdminToken();
}
