// ============= ROOM SESSION MANAGEMENT (CLASSROOM) =============
// Gestisce sessioni stanza multi-device con turni sincronizzati via API

import { setCurrentProfileId } from './profileManager';

// ============= INTERFACES =============

export interface RoomState {
  turnActive: boolean;
  turnEndsAt: number | null; // ms epoch
  promptSeed: string | null; // spunto comune
  updatedAt?: number;
}

export interface RoomSession {
  token: string;
  room: string;
  expires_at: number; // ms epoch
  roleFromClaim: 'NSU_SESSION' | 'SU';
  room_name: string;
  turn_s: number; // durata turno in secondi
  inRoom: boolean;
  roomState: RoomState;
}

export interface ClaimRoomResult {
  success: boolean;
  session?: RoomSession;
  error?: string;
  errorCode?: 'TOKEN_MISSING' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'NETWORK_ERROR' | 'ROOM_EXPIRED';
}

// ============= CONSTANTS =============

const ROOMS_API_URL = 'https://fantasmia-ai.vercel.app/api/admin/rooms';
const ROOM_SESSION_STORAGE_KEY = 'fantasmia_room_session_v1';
const POLLING_INTERVAL_MS = 3000; // 3 secondi come da specifica

// ============= LOCAL STORAGE HELPERS =============

function getRoomSessionFromStorage(): RoomSession | null {
  try {
    const stored = localStorage.getItem(ROOM_SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as RoomSession;
    
    // Verifica scadenza
    if (session.expires_at <= Date.now()) {
      console.log('🚪 Room session scaduta, pulizia...');
      localStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
      return null;
    }
    
    return session;
  } catch (error) {
    console.warn('Errore parsing room session:', error);
    return null;
  }
}

function saveRoomSession(session: RoomSession): void {
  localStorage.setItem(ROOM_SESSION_STORAGE_KEY, JSON.stringify(session));
  console.log('💾 Room session salvata, room:', session.room, 'scade:', new Date(session.expires_at).toLocaleString());
}

// ============= API CALLS =============

export async function claimRoom(room: string, token: string): Promise<ClaimRoomResult> {
  if (!room || !token) {
    return { success: false, error: 'Room o token mancante', errorCode: 'TOKEN_MISSING' };
  }

  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', room, token })
    });

    if (response.status === 410) {
      return { success: false, error: 'La stanza è scaduta.', errorCode: 'ROOM_EXPIRED' };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'Token non valido.', errorCode: 'TOKEN_INVALID' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || 'Errore accesso stanza', 
        errorCode: 'TOKEN_INVALID' 
      };
    }

    const data = await response.json();
    
    // Costruisci sessione da risposta API
    const session: RoomSession = {
      token,
      room,
      expires_at: new Date(data.session.expires_at).getTime(),
      roleFromClaim: data.session.role || 'NSU_SESSION',
      room_name: data.session.room_name || room,
      turn_s: data.session.turn_s || 180, // default 3 minuti
      inRoom: true,
      roomState: {
        turnActive: data.roomState?.turnActive ?? false,
        turnEndsAt: data.roomState?.turnEndsAt ?? null,
        promptSeed: data.roomState?.promptSeed ?? null,
        updatedAt: data.roomState?.updatedAt ?? Date.now()
      }
    };

    // Salva in localStorage
    saveRoomSession(session);

    // Imposta profilo per compatibilità con altre feature
    const roomProfileId = `room_${room.substring(0, 8)}`;
    setCurrentProfileId(roomProfileId);

    console.log('✅ Room claim success:', session.room_name, 'role:', session.roleFromClaim);
    return { success: true, session };

  } catch (error) {
    console.error('Room claim error:', error);
    return { success: false, error: 'Errore di rete', errorCode: 'NETWORK_ERROR' };
  }
}

export async function refreshRoomState(session: RoomSession): Promise<RoomState | null> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', room: session.room, token: session.token })
    });

    if (!response.ok) {
      console.warn('Room state refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    const newState: RoomState = {
      turnActive: data.roomState?.turnActive ?? false,
      turnEndsAt: data.roomState?.turnEndsAt ?? null,
      promptSeed: data.roomState?.promptSeed ?? null,
      updatedAt: Date.now()
    };

    // Aggiorna sessione in localStorage
    const updatedSession: RoomSession = { ...session, roomState: newState };
    saveRoomSession(updatedSession);

    return newState;

  } catch (error) {
    console.error('Room state refresh error:', error);
    return null;
  }
}

// ============= SU CONTROL ACTIONS =============

export async function setTurn(
  session: RoomSession, 
  turnActive: boolean, 
  adminJwt: string,
  turnEndsAt?: number
): Promise<boolean> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwt}`
      },
      body: JSON.stringify({ 
        action: 'turn', 
        room: session.room, 
        token: session.token,
        turnActive,
        turnEndsAt: turnActive ? (turnEndsAt ?? Date.now() + session.turn_s * 1000) : null
      })
    });

    if (!response.ok) {
      console.error('setTurn failed:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Aggiorna stato locale
    if (data.roomState) {
      const updatedSession: RoomSession = {
        ...session,
        roomState: {
          turnActive: data.roomState.turnActive,
          turnEndsAt: data.roomState.turnEndsAt,
          promptSeed: data.roomState.promptSeed ?? session.roomState.promptSeed,
          updatedAt: Date.now()
        }
      };
      saveRoomSession(updatedSession);
    }

    console.log('✅ Turn updated:', turnActive);
    return true;

  } catch (error) {
    console.error('setTurn error:', error);
    return false;
  }
}

export async function setPromptSeed(
  session: RoomSession, 
  promptSeed: string,
  adminJwt: string
): Promise<boolean> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwt}`
      },
      body: JSON.stringify({ 
        action: 'room_patch', 
        room: session.room, 
        token: session.token,
        promptSeed
      })
    });

    if (!response.ok) {
      console.error('setPromptSeed failed:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Aggiorna stato locale
    if (data.roomState) {
      const updatedSession: RoomSession = {
        ...session,
        roomState: {
          ...session.roomState,
          promptSeed: data.roomState.promptSeed,
          updatedAt: Date.now()
        }
      };
      saveRoomSession(updatedSession);
    }

    console.log('✅ Prompt seed updated');
    return true;

  } catch (error) {
    console.error('setPromptSeed error:', error);
    return false;
  }
}

// ============= SESSION MANAGEMENT =============

export function getRoomSession(): RoomSession | null {
  return getRoomSessionFromStorage();
}

export function isRoomSessionActive(): boolean {
  const session = getRoomSession();
  if (!session) return false;
  return session.inRoom && session.expires_at > Date.now();
}

export function getRoomRemainingTimeMs(): number {
  const session = getRoomSession();
  if (!session) return 0;
  return Math.max(0, session.expires_at - Date.now());
}

export function getTurnRemainingTimeMs(): number {
  const session = getRoomSession();
  if (!session || !session.roomState.turnActive || !session.roomState.turnEndsAt) return 0;
  return Math.max(0, session.roomState.turnEndsAt - Date.now());
}

export function isTurnActive(): boolean {
  const session = getRoomSession();
  if (!session || !session.roomState.turnActive) return false;
  if (!session.roomState.turnEndsAt) return false;
  return session.roomState.turnEndsAt > Date.now();
}

export function isEditableForNSU(): boolean {
  const session = getRoomSession();
  if (!session) return false;
  if (session.roleFromClaim === 'SU') return true; // SU sempre editabile
  return isTurnActive();
}

export function clearRoomSession(): void {
  localStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
  console.log('🚪 Room session cleared');
  
  // Pulisci history per sicurezza
  window.history.replaceState(null, '', '/');
}

// ============= POLLING HOOK HELPER =============

export function getPollingInterval(): number {
  return POLLING_INTERVAL_MS;
}

// ============= CONFLICT MANAGEMENT WITH OT =============

export function disableOTSessionIfRoomActive(): void {
  if (isRoomSessionActive()) {
    // Disabilita OT session se c'è una room attiva
    const otKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('fantasmia_onetime_')) {
        otKeys.push(key);
      }
    }
    otKeys.forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('fantasmia_onetime_session');
    
    if (otKeys.length > 0) {
      console.log('🔄 OT sessions disabled due to active room session');
    }
  }
}
