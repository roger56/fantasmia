// ============= ONE-TIME TOKEN MANAGEMENT =============
// Handles token-based NSU one-time access via Vercel API

import { fantasMiaDB } from './indexedDB';
import { getAdminToken } from '@/lib/adminAuth';

// ============= INTERFACES =============

export interface OneTimeTokenSession {
  isOneTimeToken: true;
  username: string;
  firstLoginAt: string;  // ISO timestamp
  expiresAt: string;     // ISO timestamp
  ttlHours: number;
  profileId: string;     // ID profilo temporaneo in IndexedDB
}

export interface ClaimResult {
  success: boolean;
  session?: OneTimeTokenSession;
  error?: string;
  errorCode?: 'TOKEN_MISSING' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'NETWORK_ERROR';
}

export interface CreateLinkResult {
  success: boolean;
  link?: string;
  username?: string;
  ttlHours?: number;
  inviteExpiresAt?: string;
  error?: string;
}

// ============= API ENDPOINTS =============

const CREATE_LINK_URL = 'https://fantasmia-ai.vercel.app/api/openai/create-link-one-time';
const CLAIM_LINK_URL = 'https://fantasmia-ai.vercel.app/api/openai/claim-link-one-time';
const SESSION_STORAGE_KEY = 'fantasmia_onetime_session';

// ============= CLAIM TOKEN =============

export async function claimOneTimeToken(token: string): Promise<ClaimResult> {
  if (!token || token.trim() === '') {
    return { success: false, error: 'Token mancante', errorCode: 'TOKEN_MISSING' };
  }

  try {
    const response = await fetch(CLAIM_LINK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (response.status === 410) {
      return { success: false, error: 'Link scaduto. Richiedi un nuovo link.', errorCode: 'TOKEN_EXPIRED' };
    }

    if (!response.ok) {
      return { success: false, error: 'Token non valido', errorCode: 'TOKEN_INVALID' };
    }

    const data = await response.json();
    
    // Crea profilo temporaneo in IndexedDB con prefisso onetime_
    const profileId = `onetime_${token.substring(0, 8)}`;
    await createTemporaryProfile(profileId, data.user.username);

    const session: OneTimeTokenSession = {
      isOneTimeToken: true,
      username: data.user.username,
      firstLoginAt: data.first_login_at,
      expiresAt: data.expires_at,
      ttlHours: data.ttl_h,
      profileId
    };

    // Salva in sessionStorage (non localStorage - dura solo la sessione browser)
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    return { success: true, session };
  } catch (error) {
    console.error('Claim error:', error);
    return { success: false, error: 'Errore di rete', errorCode: 'NETWORK_ERROR' };
  }
}

// ============= CREATE LINK (ADMIN) =============

export async function createOneTimeLink(
  ttlHours: number,
  username?: string,
  label?: string
): Promise<CreateLinkResult> {
  // Validazione client-side
  if (ttlHours < 1 || ttlHours > 24) {
    return { success: false, error: 'TTL deve essere tra 1 e 24 ore' };
  }

  if (username && (username.length < 2 || username.length > 30)) {
    return { success: false, error: 'Username deve essere tra 2 e 30 caratteri' };
  }

  // Get admin JWT token for Bearer authentication
  const adminToken = getAdminToken();
  if (!adminToken) {
    return { success: false, error: 'Sessione admin non valida. Effettua nuovamente il login.' };
  }

  try {
    const response = await fetch(CREATE_LINK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ ttl_h: ttlHours, username, label })
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Sessione admin scaduta. Effettua nuovamente il login.' };
      }
      return { success: false, error: 'Errore nella creazione del link' };
    }

    const data = await response.json();
    
    return {
      success: true,
      link: data.link,
      username: data.username,
      ttlHours: data.ttl_h,
      inviteExpiresAt: data.invite_exp_at
    };
  } catch (error) {
    console.error('Create link error:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

// ============= SESSION MANAGEMENT =============

export function getOneTimeSession(): OneTimeTokenSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function isOneTimeSessionActive(): boolean {
  const session = getOneTimeSession();
  if (!session) return false;
  return new Date(session.expiresAt) > new Date();
}

export function getRemainingTimeMs(): number {
  const session = getOneTimeSession();
  if (!session) return 0;
  return Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
}

export async function clearOneTimeSession(): Promise<void> {
  const session = getOneTimeSession();
  
  // Rimuovi profilo temporaneo da IndexedDB
  if (session?.profileId) {
    await deleteTemporaryProfile(session.profileId);
  }
  
  // Pulisci sessionStorage
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  
  // Pulisci anche localStorage per compatibilita
  localStorage.removeItem('fantasmia_supabase_session');
  localStorage.removeItem('fantasmia_current_user_id');
}

// ============= TEMPORARY PROFILE HELPERS =============

async function createTemporaryProfile(profileId: string, username: string): Promise<void> {
  await fantasMiaDB.init();
  
  const profile = {
    id: profileId,
    name: username,
    created_at: new Date().toISOString(),
    last_access: new Date().toISOString(),
    user_type: 'user' as const,
    status: 'active' as const,
    is_one_time_token: true,
    // Nessuna password - accesso solo via token
  };
  
  await fantasMiaDB.saveProfile(profile as any);
  console.log('✅ Created temporary one-time token profile:', profileId, username);
}

async function deleteTemporaryProfile(profileId: string): Promise<void> {
  try {
    await fantasMiaDB.init();
    await fantasMiaDB.deleteProfile(profileId);
    console.log('🗑️ Deleted temporary one-time token profile:', profileId);
  } catch (error) {
    console.warn('Error deleting temporary profile:', error);
  }
}

// ============= GARBAGE COLLECTION =============

export async function cleanupOneTimeTokenProfiles(): Promise<number> {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  
  // Find all onetime_ prefixed profiles
  const oneTimeProfiles = allProfiles.filter(p => 
    p.id.startsWith('onetime_') || (p as any).is_one_time_token === true
  );
  
  let deletedCount = 0;
  for (const profile of oneTimeProfiles) {
    try {
      await fantasMiaDB.deleteProfile(profile.id);
      deletedCount++;
    } catch (e) {
      console.warn('Error deleting one-time profile:', profile.id, e);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deletedCount} one-time token profiles`);
  }
  
  return deletedCount;
}
