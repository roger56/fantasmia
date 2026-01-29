// ============= ROOM SESSION MANAGEMENT (CLASSROOM) =============
// Gestisce sessioni stanza multi-device con turni sincronizzati via API V2

import { setCurrentProfileId } from './profileManager';

// ============= INTERFACES =============

export interface RoomState {
  activity_title: string;
  room_mode: 'CONTINUA_TU' | 'CAMPBELL' | 'PROPP';
  prompt_seed: string;
  story_so_far: string;
  writers: string[];
  current_writer_index: number;
  turn_ends_at: number | null; // ms epoch
  turn_paused: boolean; // turno in pausa
  turn_remaining_ms: number | null; // ms rimanenti quando in pausa
  expires_at: number; // ms epoch
}

export interface RoomSession {
  room: string;
  room_name: string;
  writer_id: string; // "Writer 1", "Writer 2", etc.
  writer_index: number; // 0, 1, 2...
  expires_at: number; // ms epoch
  roomState: RoomState;
}

export interface ClaimRoomResult {
  success: boolean;
  session?: RoomSession;
  error?: string;
  errorCode?: 'ROOM_EXPIRED' | 'ROOM_NOT_FOUND' | 'NETWORK_ERROR';
}

// ============= CONSTANTS =============

const ROOMS_API_URL = 'https://fantasmia-ai.vercel.app/api/admin/rooms';
const ROOM_SESSION_STORAGE_KEY = 'fantasmia_room_session_v2';
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
  console.log('💾 Room session salvata, room:', session.room, 'writer:', session.writer_id);
}

// ============= HELPERS =============

function parseRoomState(rs: any): RoomState {
  return {
    activity_title: rs.activity_title || '',
    room_mode: rs.room_mode || 'CONTINUA_TU',
    prompt_seed: rs.prompt_seed || '',
    story_so_far: rs.story_so_far || '',
    writers: rs.writers || [],
    current_writer_index: rs.current_writer_index ?? 0,
    turn_ends_at: rs.turn_ends_at ?? null,
    turn_paused: rs.turn_paused ?? false,
    turn_remaining_ms: rs.turn_remaining_ms ?? null,
    expires_at: rs.expires_at
  };
}

// ============= API CALLS =============

/**
 * Join a room as a new writer (NSU entry point)
 * API: action="join"
 */
export async function claimRoom(room: string): Promise<ClaimRoomResult> {
  if (!room) {
    return { success: false, error: 'Room mancante', errorCode: 'ROOM_NOT_FOUND' };
  }

  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', room })
    });

    if (response.status === 410) {
      return { success: false, error: 'La stanza è scaduta.', errorCode: 'ROOM_EXPIRED' };
    }

    if (response.status === 404) {
      return { success: false, error: 'Stanza non trovata.', errorCode: 'ROOM_NOT_FOUND' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || 'Errore accesso stanza', 
        errorCode: 'NETWORK_ERROR' 
      };
    }

    const data = await response.json();
    
    // data contiene: success, writer_id, writer_index, room_state
    const roomState = data.room_state;
    
    const session: RoomSession = {
      room,
      room_name: roomState.room_name || room,
      writer_id: data.writer_id,
      writer_index: data.writer_index,
      expires_at: roomState.expires_at,
      roomState: parseRoomState(roomState)
    };

    // Salva in localStorage
    saveRoomSession(session);

    // Imposta profilo per compatibilità con altre feature
    const roomProfileId = `room_${room.substring(0, 8)}`;
    setCurrentProfileId(roomProfileId);

    console.log('✅ Room join success:', session.room_name, 'writer:', session.writer_id);
    return { success: true, session };

  } catch (error) {
    console.error('Room join error:', error);
    return { success: false, error: 'Errore di rete', errorCode: 'NETWORK_ERROR' };
  }
}

/**
 * Get current room state (polling)
 * API: action="get_state"
 */
export async function refreshRoomState(session: RoomSession): Promise<RoomState | null> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_state', room: session.room })
    });

    if (response.status === 404) {
      console.warn('Room not found during refresh');
      clearRoomSession();
      return null;
    }

    if (!response.ok) {
      console.warn('Room state refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    const newState = parseRoomState(data.room_state);

    // Aggiorna sessione in localStorage
    const updatedSession: RoomSession = { ...session, roomState: newState };
    saveRoomSession(updatedSession);

    return newState;

  } catch (error) {
    console.error('Room state refresh error:', error);
    return null;
  }
}

/**
 * Submit text contribution (NSU during their turn)
 * API: action="submit_text"
 */
export async function submitText(
  session: RoomSession, 
  text: string
): Promise<{ success: boolean; error?: string; roomState?: RoomState }> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'submit_text', 
        room: session.room, 
        writer_id: session.writer_id,
        text
      })
    });

    if (response.status === 403) {
      return { success: false, error: 'Non è il tuo turno' };
    }

    if (response.status === 404) {
      return { success: false, error: 'Stanza non trovata' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Errore invio testo' };
    }

    const data = await response.json();
    const newState = parseRoomState(data.room_state);

    // Aggiorna sessione in localStorage
    const updatedSession: RoomSession = { ...session, roomState: newState };
    saveRoomSession(updatedSession);

    return { success: true, roomState: newState };

  } catch (error) {
    console.error('Submit text error:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

// ============= SU CONTROL ACTIONS =============

/**
 * Advance to next turn (SU only)
 * API: action="next_turn"
 */
export async function nextTurn(
  room: string,
  adminJwt: string,
  turnS: number = 180
): Promise<{ success: boolean; roomState?: RoomState; error?: string }> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwt}`
      },
      body: JSON.stringify({ 
        action: 'next_turn', 
        room,
        turn_s: turnS
      })
    });

    if (response.status === 401) {
      return { success: false, error: 'Sessione scaduta, rifai login' };
    }

    if (response.status === 409) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.includes('no writers')) {
        return { success: false, error: 'Prima fai entrare almeno un partecipante' };
      }
      return { success: false, error: errorData.error || 'Errore turno' };
    }

    if (!response.ok) {
      console.error('next_turn failed:', response.status);
      return { success: false, error: 'Errore avanzamento turno' };
    }

    const data = await response.json();
    if (data.room_state) {
      return { success: true, roomState: parseRoomState(data.room_state) };
    }

    return { success: true };

  } catch (error) {
    console.error('nextTurn error:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

/**
 * Pause current turn (SU only)
 * API: action="pause_turn"
 */
export async function pauseTurn(
  room: string,
  adminJwt: string
): Promise<{ success: boolean; roomState?: RoomState; error?: string }> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwt}`
      },
      body: JSON.stringify({ 
        action: 'pause_turn', 
        room
      })
    });

    if (response.status === 401) {
      return { success: false, error: 'Sessione scaduta, rifai login' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Errore pausa turno' };
    }

    const data = await response.json();
    if (data.room_state) {
      return { success: true, roomState: parseRoomState(data.room_state) };
    }

    return { success: true };

  } catch (error) {
    console.error('pauseTurn error:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

/**
 * Resume paused turn (SU only)
 * API: action="resume_turn"
 */
export async function resumeTurn(
  room: string,
  adminJwt: string
): Promise<{ success: boolean; roomState?: RoomState; error?: string }> {
  try {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwt}`
      },
      body: JSON.stringify({ 
        action: 'resume_turn', 
        room
      })
    });

    if (response.status === 401) {
      return { success: false, error: 'Sessione scaduta, rifai login' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Errore ripresa turno' };
    }

    const data = await response.json();
    if (data.room_state) {
      return { success: true, roomState: parseRoomState(data.room_state) };
    }

    return { success: true };

  } catch (error) {
    console.error('resumeTurn error:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

/**
 * Update prompt seed (SU only) - included in create, not separate action
 * NOTE: prompt_seed should be set during room creation
 */
export async function setPromptSeed(
  room: string,
  promptSeed: string,
  adminJwt: string
): Promise<boolean> {
  // NOTE: L'API attuale non supporta room_patch separato
  // Il prompt_seed va impostato durante la creazione della stanza
  console.warn('setPromptSeed: action non supportata, usare create con prompt_seed');
  return false;
}

// ============= SESSION MANAGEMENT =============

export function getRoomSession(): RoomSession | null {
  return getRoomSessionFromStorage();
}

export function isRoomSessionActive(): boolean {
  const session = getRoomSession();
  if (!session) return false;
  return session.expires_at > Date.now();
}

export function getRoomRemainingTimeMs(): number {
  const session = getRoomSession();
  if (!session) return 0;
  return Math.max(0, session.expires_at - Date.now());
}

export function getTurnRemainingTimeMs(): number {
  const session = getRoomSession();
  if (!session) return 0;
  
  // Se in pausa, usa turn_remaining_ms
  if (session.roomState.turn_paused && session.roomState.turn_remaining_ms != null) {
    return session.roomState.turn_remaining_ms;
  }
  
  // Altrimenti calcola da turn_ends_at
  if (!session.roomState.turn_ends_at) return 0;
  return Math.max(0, session.roomState.turn_ends_at - Date.now());
}

export function isMyTurn(): boolean {
  const session = getRoomSession();
  if (!session) return false;
  return session.roomState.current_writer_index === session.writer_index;
}

export function isTurnActive(): boolean {
  const session = getRoomSession();
  if (!session) return false;
  
  // Se in pausa, il turno è "attivo" ma congelato
  if (session.roomState.turn_paused) return true;
  
  if (!session.roomState.turn_ends_at) return false;
  return session.roomState.turn_ends_at > Date.now();
}

export function isTurnPaused(): boolean {
  const session = getRoomSession();
  if (!session) return false;
  return session.roomState.turn_paused;
}

export function isEditableForNSU(): boolean {
  // NSU può editare se è il suo turno E turno attivo E NON in pausa
  const session = getRoomSession();
  if (!session) return false;
  if (session.roomState.turn_paused) return false;
  return isMyTurn() && isTurnActive();
}

export function clearRoomSession(): void {
  localStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
  // Also clear old v1 session if exists
  localStorage.removeItem('fantasmia_room_session_v1');
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
