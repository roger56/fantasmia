// ============= ONE-TIME TOKEN MANAGEMENT =============
// Handles token-based NSU one-time access via Vercel API

import { fantasMiaDB } from './indexedDB';
import { getAdminToken } from '@/lib/adminAuth';
import { setCurrentProfileId } from './profileManager';
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
const SEND_EMAIL_URL = 'https://fantasmia-ai.vercel.app/api/openai/send_email_ai';
const SESSION_STORAGE_KEY = 'fantasmia_onetime_session';
const LOCAL_STORAGE_KEY_PREFIX = 'fantasmia_onetime_';

// ============= OT ACTIVATION EMAIL NOTIFICATION =============
// SECURITY: Email di fallback hardcoded per garantire notifica anche quando
// IndexedDB del browser OT è vuoto (l'utente OT non ha le settings del SU)
const FALLBACK_NOTIFICATION_EMAIL = 'quando.ruggero@gmail.com';

async function sendOTActivationNotification(
  session: OneTimeTokenSession,
  createdBySu?: string
): Promise<void> {
  try {
    // Tenta di recuperare email da IndexedDB (potrebbe essere vuoto nel browser OT)
    let recipientEmail: string | undefined;
    try {
      await fantasMiaDB.init();
      const settings = await fantasMiaDB.getSystemSettings();
      recipientEmail = settings.album_default_email;
    } catch {
      console.log('📧 OT Notification: IndexedDB non disponibile, uso fallback');
    }
    
    // Usa fallback se nessuna email configurata
    if (!recipientEmail) {
      recipientEmail = FALLBACK_NOTIFICATION_EMAIL;
      console.log('📧 OT Notification: uso email fallback:', recipientEmail);
    }

    const timestamp = new Date().toLocaleString('it-IT', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">🔗 Link One-Time Attivato</h2>
        <p>Un link di accesso One-Time è stato utilizzato per la prima volta.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Data/Ora</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${timestamp}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Utente OT</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${session.username}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>ID Profilo</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><code>${session.profileId}</code></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Scadenza sessione</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date(session.expiresAt).toLocaleString('it-IT')}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Durata (TTL)</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${session.ttlHours} ore</td>
          </tr>
          ${createdBySu ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Creato da SU</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${createdBySu}</td>
          </tr>
          ` : ''}
        </table>
        <p style="color: #6b7280; font-size: 12px;">Questa è una notifica automatica di FantasMia.</p>
      </div>
    `;

    const payload = {
      to: recipientEmail,
      subject: `🔗 FantasMia: Link OT attivato - ${session.username}`,
      html: htmlBody
    };

    const response = await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('📧 OT Notification: email inviata a', recipientEmail);
    } else {
      console.warn('📧 OT Notification: risposta non ok', response.status);
    }
  } catch (error) {
    console.error('📧 OT Notification: errore invio email', error);
  }
}

// ============= HELPER: Token Storage Key =============

function getTokenStorageKey(token: string): string {
  // Usa primi 16 caratteri del token come chiave stabile
  const tokenHash = token.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '');
  return `${LOCAL_STORAGE_KEY_PREFIX}${tokenHash}`;
}

// ============= HELPER: Get Existing Session =============

function getExistingSession(token: string): OneTimeTokenSession | null {
  try {
    const key = getTokenStorageKey(token);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as OneTimeTokenSession;
    // Verifica che non sia scaduta
    if (new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(key);
      console.log('🕐 Sessione one-time scaduta, rimossa da localStorage');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// ============= CLAIM TOKEN =============

export async function claimOneTimeToken(token: string): Promise<ClaimResult> {
  if (!token || token.trim() === '') {
    return { success: false, error: 'Token mancante', errorCode: 'TOKEN_MISSING' };
  }

  // ✅ Verifica se esiste già una sessione valida per questo token (localStorage)
  const existingSession = getExistingSession(token);
  if (existingSession) {
    console.log('♻️ Riutilizzo sessione one-time esistente, scade:', existingSession.expiresAt);
    // Sincronizza anche sessionStorage per compatibilità hook
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(existingSession));
    // ✅ Imposta profilo corrente per daily stories e altre feature
    setCurrentProfileId(existingSession.profileId);
    return { success: true, session: existingSession };
  }

  // Nessuna sessione esistente → procedi con claim API
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

    // ✅ Salva in localStorage (persistente tra tab e refresh)
    const storageKey = getTokenStorageKey(token);
    localStorage.setItem(storageKey, JSON.stringify(session));
    console.log('💾 Sessione one-time salvata in localStorage, scade:', session.expiresAt);

    // Mantieni anche sessionStorage per compatibilità
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    
    // ✅ Imposta profilo corrente per daily stories e altre feature
    setCurrentProfileId(profileId);

    // Pre-load daily stories in background (non-blocking) for faster OT experience
    fantasMiaDB.ensureDailyStoriesLoaded().catch(err => {
      console.warn('OT: Pre-load daily stories failed (non-blocking):', err);
    });

    // 📧 Invia notifica email al primo utilizzo del link OT (non-blocking)
    sendOTActivationNotification(session, data.created_by_su).catch(err => {
      console.warn('OT: Notifica email fallita (non-blocking):', err);
    });

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
    // Prima controlla sessionStorage (più veloce)
    let stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as OneTimeTokenSession;
      if (new Date(session.expiresAt) > new Date()) {
        return session;
      }
      // Sessione scaduta, rimuovi
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    
    // Fallback: cerca in localStorage tutte le sessioni onetime_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const session = JSON.parse(data) as OneTimeTokenSession;
          if (new Date(session.expiresAt) > new Date()) {
            // Sincronizza in sessionStorage per accesso veloce
            sessionStorage.setItem(SESSION_STORAGE_KEY, data);
            return session;
          } else {
            // Pulisci sessione scaduta
            localStorage.removeItem(key);
          }
        }
      }
    }
    return null;
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
  
  // ✅ Pulisci tutte le sessioni one-time da localStorage
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  if (keysToRemove.length > 0) {
    console.log('🧹 Pulite', keysToRemove.length, 'sessioni one-time da localStorage');
  }
  
  // Pulisci anche chiavi legacy per compatibilita
  localStorage.removeItem('fantasmia_supabase_session');
  localStorage.removeItem('fantasmia_current_user_id');
  
  // 🛡️ SECURITY: Pulisci history e redirect per evitare back a pagine protette
  window.history.replaceState(null, '', '/');
  console.log('🛡️ History cleaned after OT session clear');
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
