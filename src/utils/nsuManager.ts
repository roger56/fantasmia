// NSU (Non-Superuser) Management Service
// Handles creation, authentication, and lifecycle of NSU profiles

import { fantasMiaDB } from './indexedDB';
import { 
  hashPassword, 
  verifyPassword, 
  generateSecurePassword, 
  rateLimiter,
  checkPasswordRequirements,
  isPasswordStrong
} from './authSecurity';

// ============= INTERFACES =============

export interface SUSettings {
  id: 'su_config';
  max_nsu: number;
  default_nsu_expiry_days: number;
  auto_cleanup_inactive_days: number;
  updated_at: string;
}

export interface ExtendedProfile {
  id: string;
  name: string;
  created_at: string;
  last_access: string;
  email?: string;
  user_type?: 'superuser' | 'user';
  password_hash?: string;
  updated_at?: string;
  // NSU-specific fields
  created_by_su_id?: string;
  status: 'active' | 'disabled';
  expires_at?: string;
  force_password_change?: boolean;
  last_login_at?: string;
  notes?: string;
  is_one_time?: boolean;  // If true, profile is disabled after first successful login
}

export interface CreateNSUPayload {
  name: string;
  password?: string;
  isTemporary?: boolean;
  expiryDays?: number;
  isOneTime?: boolean;  // Create a one-time use profile
  notes?: string;
}

export interface NSUCreationResult {
  profile: ExtendedProfile;
  generatedPassword?: string;
}

export interface AuthResult {
  success: boolean;
  profile?: ExtendedProfile;
  error?: string;
  needsPasswordChange?: boolean;
}

// ============= CONSTANTS =============

const DEFAULT_MAX_NSU = 20;
const DEFAULT_EXPIRY_DAYS = 7;
const DEFAULT_INACTIVE_DAYS = 30;
const SU_SETTINGS_KEY = 'fantasmia_su_settings';

// ============= SU SETTINGS MANAGEMENT =============

export const getSUSettingsWithDefaults = async (): Promise<SUSettings> => {
  try {
    const stored = localStorage.getItem(SU_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading SU settings:', e);
  }
  
  return {
    id: 'su_config',
    max_nsu: DEFAULT_MAX_NSU,
    default_nsu_expiry_days: DEFAULT_EXPIRY_DAYS,
    auto_cleanup_inactive_days: DEFAULT_INACTIVE_DAYS,
    updated_at: new Date().toISOString()
  };
};

export const saveSUSettings = async (settings: SUSettings): Promise<void> => {
  settings.updated_at = new Date().toISOString();
  localStorage.setItem(SU_SETTINGS_KEY, JSON.stringify(settings));
};

// ============= NSU QUERY HELPERS =============

export const getNSUProfilesBySU = async (suId: string): Promise<ExtendedProfile[]> => {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  
  return allProfiles
    .filter(p => p.created_by_su_id === suId || (p.user_type === 'user' && p.id !== 'superuser'))
    .map(p => ({
      ...p,
      status: (p as any).status || 'active',
      user_type: p.user_type as 'superuser' | 'user' | undefined
    })) as ExtendedProfile[];
};

export const countActiveNSU = async (suId: string): Promise<number> => {
  const profiles = await getNSUProfilesBySU(suId);
  return profiles.filter(p => p.status === 'active').length;
};

export const getExpiredProfiles = async (): Promise<ExtendedProfile[]> => {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  const now = new Date();
  
  return allProfiles.filter(p => {
    const expiresAt = (p as any).expires_at;
    return expiresAt && new Date(expiresAt) < now;
  }) as ExtendedProfile[];
};

export const getInactiveProfiles = async (daysSinceLogin: number): Promise<ExtendedProfile[]> => {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceLogin);
  
  return allProfiles.filter(p => {
    if (p.id === 'superuser' || p.user_type === 'superuser') return false;
    const lastLogin = (p as any).last_login_at || p.last_access;
    return lastLogin && new Date(lastLogin) < cutoff;
  }) as ExtendedProfile[];
};

// ============= NSU CREATION =============

export const createNSU = async (
  suId: string,
  payload: CreateNSUPayload
): Promise<NSUCreationResult> => {
  await fantasMiaDB.init();
  
  // 1. Check MAX_NSU limit
  const activeCount = await countActiveNSU(suId);
  const settings = await getSUSettingsWithDefaults();
  
  if (activeCount >= settings.max_nsu) {
    throw new Error(`Limite raggiunto: massimo ${settings.max_nsu} NSU attivi`);
  }
  
  // 2. Check for duplicate name
  const existingProfiles = await fantasMiaDB.getProfiles();
  const duplicate = existingProfiles.find(
    p => p.name.toLowerCase() === payload.name.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Esiste già un profilo con nome "${payload.name}"`);
  }
  
  // 3. Generate or hash password
  const password = payload.password || generateSecurePassword(12);
  const passwordHash = await hashPassword(password);
  const wasGenerated = !payload.password;
  
  // 4. Calculate expiry if temporary
  let expiresAt: string | undefined;
  if (payload.isTemporary) {
    const days = payload.expiryDays || settings.default_nsu_expiry_days;
    if (days > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      expiresAt = expiry.toISOString();
    }
  }
  
  // 5. Create profile
  const now = new Date().toISOString();
  const profile: ExtendedProfile = {
    id: crypto.randomUUID(),
    name: payload.name,
    created_at: now,
    last_access: now,
    user_type: 'user',
    password_hash: passwordHash,
    created_by_su_id: suId,
    status: 'active',
    expires_at: expiresAt,
    force_password_change: false, // Demo mode: mai richiedere cambio password
    notes: payload.notes,
    is_one_time: payload.isOneTime || false
  };
  
  // 6. Save to IndexedDB
  await fantasMiaDB.saveProfile(profile as any);
  
  // 7. Also save to localStorage for compatibility with existing auth
  syncProfileToLocalStorage(profile, password);
  
  console.log('✅ NSU created:', { id: profile.id, name: profile.name, temporary: !!expiresAt });
  
  return {
    profile,
    generatedPassword: wasGenerated ? password : undefined
  };
};

// ============= NSU AUTHENTICATION =============

export const authenticateNSU = async (
  profileId: string,
  password: string
): Promise<AuthResult> => {
  await fantasMiaDB.init();
  
  // Rate limiting check
  if (rateLimiter.isBlocked(profileId)) {
    return { 
      success: false, 
      error: 'Troppi tentativi. Riprova tra qualche minuto.' 
    };
  }
  
  // Get profile from IndexedDB
  const allProfiles = await fantasMiaDB.getProfiles();
  const profile = allProfiles.find(p => p.id === profileId) as ExtendedProfile | undefined;
  
  if (!profile) {
    rateLimiter.recordAttempt(profileId, false);
    return { success: false, error: 'Profilo non trovato' };
  }
  
  // Check status
  if ((profile as any).status === 'disabled') {
    return { 
      success: false, 
      error: 'Profilo disabilitato. Contatta il Superuser.' 
    };
  }
  
  // Check expiry
  const expiresAt = (profile as any).expires_at;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { 
      success: false, 
      error: 'Profilo scaduto. Contatta il Superuser.' 
    };
  }
  
  // ============= DEMO MODE: Password semplificata =============
  // Password attesa: username + "-1" (case-insensitive)
  const expectedDemoPassword = profile.name.toLowerCase() + "-1";
  const isDemoPasswordMatch = password.toLowerCase() === expectedDemoPassword;
  
  if (isDemoPasswordMatch) {
    rateLimiter.recordAttempt(profileId, true);
    
    // Update last login
    const updatedProfile = {
      ...profile,
      last_login_at: new Date().toISOString(),
      last_access: new Date().toISOString(),
      status: profile.status || 'active'
    };
    await fantasMiaDB.saveProfile(updatedProfile as any);
    
    // Handle one-time NSU: disable after first successful login
    if ((profile as any).is_one_time === true) {
      console.log('⚡ One-time NSU login - disabling after use:', profile.id, profile.name);
      const disabledProfile = {
        ...updatedProfile,
        status: 'disabled' as const,
        expires_at: new Date().toISOString(),
        notes: (updatedProfile.notes || '') + ' [One-time: usato]'
      };
      await fantasMiaDB.saveProfile(disabledProfile as any);
    }
    
    console.log('✅ Demo login successful for:', profile.name);
    return {
      success: true,
      profile: updatedProfile,
      needsPasswordChange: false // Mai richiedere cambio password in demo mode
    };
  }
  
  // Password verification (fallback per password custom impostate dal SU)
  const passwordHash = profile.password_hash;
  
  if (!passwordHash) {
    // LAZY MIGRATION: password = name (legacy profiles) - reset silenzioso
    rateLimiter.recordAttempt(profileId, false);
    return { success: false, error: 'Password non corretta. Usa: ' + profile.name.toLowerCase() + '-1' };
  }
  
  // Bcrypt verification
  const isValid = await verifyPassword(password, passwordHash);
  
  if (!isValid) {
    rateLimiter.recordAttempt(profileId, false);
    const remaining = rateLimiter.getRemainingAttempts(profileId);
    return {
      success: false,
      error: remaining > 0
        ? `Password non corretta. Tentativi rimasti: ${remaining}`
        : 'Account bloccato per troppi tentativi'
    };
  }
  
  rateLimiter.recordAttempt(profileId, true);
  
  // Update last login
  const updatedProfile = {
    ...profile,
    last_login_at: new Date().toISOString(),
    last_access: new Date().toISOString(),
    status: profile.status || 'active'
  };
  await fantasMiaDB.saveProfile(updatedProfile as any);
  
  // Handle one-time NSU: disable after first successful login
  if ((profile as any).is_one_time === true) {
    console.log('⚡ One-time NSU login - disabling after use:', profile.id, profile.name);
    const disabledProfile = {
      ...updatedProfile,
      status: 'disabled' as const,
      expires_at: new Date().toISOString(), // Expire immediately for GC
      notes: (updatedProfile.notes || '') + ' [One-time: usato]'
    };
    await fantasMiaDB.saveProfile(disabledProfile as any);
  }
  
  return {
    success: true,
    profile: updatedProfile,
    needsPasswordChange: (profile as any).force_password_change === true
  };
};

// ============= NSU OPERATIONS =============

export const disableNSU = async (profileId: string): Promise<void> => {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  const profile = allProfiles.find(p => p.id === profileId);
  
  if (!profile) throw new Error('Profilo non trovato');
  
  const updated = { ...profile, status: 'disabled', updated_at: new Date().toISOString() };
  await fantasMiaDB.saveProfile(updated as any);
  console.log('🚫 NSU disabled:', profileId);
};

export const enableNSU = async (profileId: string): Promise<void> => {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  const profile = allProfiles.find(p => p.id === profileId);
  
  if (!profile) throw new Error('Profilo non trovato');
  
  const updated = { ...profile, status: 'active', updated_at: new Date().toISOString() };
  await fantasMiaDB.saveProfile(updated as any);
  console.log('✅ NSU enabled:', profileId);
};

export const deleteNSU = async (profileId: string): Promise<void> => {
  await fantasMiaDB.init();
  await fantasMiaDB.deleteProfile(profileId);
  
  // Also remove from localStorage
  removeProfileFromLocalStorage(profileId);
  
  console.log('🗑️ NSU deleted:', profileId);
};

export const resetNSUPassword = async (
  profileId: string,
  newPassword?: string
): Promise<string> => {
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  const profile = allProfiles.find(p => p.id === profileId);
  
  if (!profile) throw new Error('Profilo non trovato');
  
  const password = newPassword || generateSecurePassword(12);
  const passwordHash = await hashPassword(password);
  
  const updated = {
    ...profile,
    password_hash: passwordHash,
    force_password_change: !newPassword, // Force change if auto-generated
    updated_at: new Date().toISOString()
  };
  
  await fantasMiaDB.saveProfile(updated as any);
  
  // Update localStorage
  syncProfileToLocalStorage(updated as ExtendedProfile, password);
  
  console.log('🔑 NSU password reset:', profileId);
  return password;
};

export const updateNSUPassword = async (
  profileId: string,
  newPassword: string
): Promise<void> => {
  if (!isPasswordStrong(newPassword)) {
    throw new Error('La password non rispetta i requisiti di sicurezza');
  }
  
  await fantasMiaDB.init();
  const allProfiles = await fantasMiaDB.getProfiles();
  const profile = allProfiles.find(p => p.id === profileId);
  
  if (!profile) throw new Error('Profilo non trovato');
  
  const passwordHash = await hashPassword(newPassword);
  
  const updated = {
    ...profile,
    password_hash: passwordHash,
    force_password_change: false,
    updated_at: new Date().toISOString()
  };
  
  await fantasMiaDB.saveProfile(updated as any);
  
  // Update localStorage
  syncProfileToLocalStorage(updated as ExtendedProfile, newPassword);
  
  console.log('🔑 NSU password updated:', profileId);
};

// ============= GARBAGE COLLECTION =============

export const cleanupExpiredProfiles = async (): Promise<number> => {
  const expired = await getExpiredProfiles();
  
  for (const profile of expired) {
    await deleteNSU(profile.id);
  }
  
  if (expired.length > 0) {
    console.log(`🧹 Cleaned up ${expired.length} expired NSU profiles`);
  }
  
  return expired.length;
};

export const cleanupInactiveProfiles = async (suId: string): Promise<number> => {
  const settings = await getSUSettingsWithDefaults();
  const inactive = await getInactiveProfiles(settings.auto_cleanup_inactive_days);
  
  // Only cleanup profiles created by this SU
  const toCleanup = inactive.filter(p => p.created_by_su_id === suId);
  
  for (const profile of toCleanup) {
    await deleteNSU(profile.id);
  }
  
  if (toCleanup.length > 0) {
    console.log(`🧹 Cleaned up ${toCleanup.length} inactive NSU profiles`);
  }
  
  return toCleanup.length;
};

// ============= LOCALSTORAGE SYNC (for compatibility) =============

const syncProfileToLocalStorage = (profile: ExtendedProfile, password: string): void => {
  try {
    const key = 'fantasmia_users';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    const userIndex = existing.findIndex((u: any) => u.id === profile.id);
    const userData = {
      id: profile.id,
      name: profile.name,
      password: password, // Keep plain password for legacy auth
      age: 10, // Default age
      createdAt: profile.created_at
    };
    
    if (userIndex >= 0) {
      existing[userIndex] = userData;
    } else {
      existing.push(userData);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    console.warn('Error syncing profile to localStorage:', e);
  }
};

const removeProfileFromLocalStorage = (profileId: string): void => {
  try {
    const key = 'fantasmia_users';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = existing.filter((u: any) => u.id !== profileId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Error removing profile from localStorage:', e);
  }
};

// ============= EXPORTS =============

export { checkPasswordRequirements, isPasswordStrong };
