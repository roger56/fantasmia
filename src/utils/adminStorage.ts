// Admin Storage Utility - IndexedDB persistence for ADMIN data
// Uses dedicated namespace to avoid conflicts with main app data

import { openDB, IDBPDatabase } from 'idb';

const ADMIN_DB_NAME = 'FantasMiaAdmin';
const ADMIN_DB_VERSION = 1;

// ====== Interfaces ======

export interface AdminSUUser {
  id: string;
  username: string;
  initialPassword: string;
  cell: string;
  mail: string;
  cei?: string;
  organizationType?: string;
  contract3F: 'Free' | 'Family' | 'Fantasy';
  maxNSU: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrgType {
  id: string;
  name: string;
  createdAt: string;
}

export interface AdminFeatureAssignment {
  id: string;
  featureId: string;
  contract3F: 'Free' | 'Family' | 'Fantasy';
  enabled: boolean;
}

export interface AdminSettings {
  id: 'main';
  demoPassword?: string;
  updatedAt?: string;
}

// ====== Default Data ======

export const DEFAULT_ORG_TYPES: string[] = [
  'famiglia',
  'biblioteca',
  'scuola',
  'oratorio',
  'parrocchia',
  'associazione'
];

export const DEFAULT_FEATURES = [
  { id: 'stories_no_ai', name: 'Creazione storie senza AI' },
  { id: 'stories_ag', name: 'Creazione storie AG (gestore)' },
  { id: 'daily_stories', name: 'Racconti del giorno (gestione)' },
  { id: 'dictionary_it', name: 'Dizionario IT' },
  { id: 'dictionary_en', name: 'Dizionario EN' },
  { id: 'butterfly', name: 'Farfalla "Conosci la parola"' },
  { id: 'media_ai_text', name: 'MEDIA(AI): migliora testo' },
  { id: 'media_ai_poetry', name: 'MEDIA(AI): poesia' },
  { id: 'media_ai_drawing', name: 'MEDIA(AI): disegno' },
  { id: 'media_ai_video', name: 'MEDIA(AI): filmato' },
  { id: 'album_creation', name: 'Creazione album' }
];

// ====== Database Instance ======

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(ADMIN_DB_NAME, ADMIN_DB_VERSION, {
    upgrade(db) {
      // SU Users store
      if (!db.objectStoreNames.contains('su_users')) {
        db.createObjectStore('su_users', { keyPath: 'id' });
      }
      
      // Org Types store
      if (!db.objectStoreNames.contains('org_types')) {
        db.createObjectStore('org_types', { keyPath: 'id' });
      }
      
      // Features Matrix store
      if (!db.objectStoreNames.contains('features_matrix')) {
        db.createObjectStore('features_matrix', { keyPath: 'id' });
      }
      
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    }
  });

  return dbInstance;
}

// ====== SU Users CRUD ======

export async function getSUUsers(): Promise<AdminSUUser[]> {
  const db = await getDB();
  return db.getAll('su_users');
}

export async function getSUUserById(id: string): Promise<AdminSUUser | undefined> {
  const db = await getDB();
  return db.get('su_users', id);
}

export async function saveSUUser(user: AdminSUUser): Promise<void> {
  const db = await getDB();
  await db.put('su_users', user);
}

export async function deleteSUUser(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('su_users', id);
}

// ====== Org Types CRUD ======

export async function getOrgTypes(): Promise<AdminOrgType[]> {
  const db = await getDB();
  const types = await db.getAll('org_types');
  
  // Initialize with defaults if empty
  if (types.length === 0) {
    await initializeDefaultOrgTypes();
    return db.getAll('org_types');
  }
  
  return types;
}

export async function saveOrgType(orgType: AdminOrgType): Promise<void> {
  const db = await getDB();
  await db.put('org_types', orgType);
}

export async function deleteOrgType(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('org_types', id);
}

async function initializeDefaultOrgTypes(): Promise<void> {
  const db = await getDB();
  for (const name of DEFAULT_ORG_TYPES) {
    const orgType: AdminOrgType = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString()
    };
    await db.put('org_types', orgType);
  }
}

// ====== Features Matrix CRUD ======

export async function getFeatureAssignments(): Promise<AdminFeatureAssignment[]> {
  const db = await getDB();
  const assignments = await db.getAll('features_matrix');
  
  // Initialize with defaults if empty
  if (assignments.length === 0) {
    await initializeDefaultFeatures();
    return db.getAll('features_matrix');
  }
  
  return assignments;
}

export async function saveFeatureAssignment(assignment: AdminFeatureAssignment): Promise<void> {
  const db = await getDB();
  await db.put('features_matrix', assignment);
}

export async function saveAllFeatureAssignments(assignments: AdminFeatureAssignment[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('features_matrix', 'readwrite');
  await tx.objectStore('features_matrix').clear();
  for (const assignment of assignments) {
    await tx.objectStore('features_matrix').put(assignment);
  }
  await tx.done;
}

async function initializeDefaultFeatures(): Promise<void> {
  const db = await getDB();
  const contracts: Array<'Free' | 'Family' | 'Fantasy'> = ['Free', 'Family', 'Fantasy'];
  
  // Default feature availability by contract
  const featureDefaults: Record<string, { Free: boolean; Family: boolean; Fantasy: boolean }> = {
    'stories_no_ai': { Free: true, Family: true, Fantasy: true },
    'stories_ag': { Free: false, Family: false, Fantasy: true },
    'daily_stories': { Free: false, Family: true, Fantasy: true },
    'dictionary_it': { Free: true, Family: true, Fantasy: true },
    'dictionary_en': { Free: false, Family: true, Fantasy: true },
    'butterfly': { Free: false, Family: true, Fantasy: true },
    'media_ai_text': { Free: false, Family: true, Fantasy: true },
    'media_ai_poetry': { Free: false, Family: true, Fantasy: true },
    'media_ai_drawing': { Free: false, Family: false, Fantasy: true },
    'media_ai_video': { Free: false, Family: false, Fantasy: true },
    'album_creation': { Free: false, Family: false, Fantasy: true }
  };
  
  for (const feature of DEFAULT_FEATURES) {
    for (const contract of contracts) {
      const assignment: AdminFeatureAssignment = {
        id: `${feature.id}_${contract}`,
        featureId: feature.id,
        contract3F: contract,
        enabled: featureDefaults[feature.id]?.[contract] ?? false
      };
      await db.put('features_matrix', assignment);
    }
  }
}

// ====== Settings CRUD ======

export async function getAdminSettings(): Promise<AdminSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  return settings || { id: 'main' };
}

export async function saveAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
  const db = await getDB();
  const current = await getAdminSettings();
  await db.put('settings', {
    ...current,
    ...settings,
    id: 'main',
    updatedAt: new Date().toISOString()
  });
}

// ====== Utility Functions ======

export function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function createNewSUUser(partial: Partial<AdminSUUser> = {}): AdminSUUser {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    username: '',
    initialPassword: generatePassword(),
    cell: '',
    mail: '',
    contract3F: 'Free',
    maxNSU: 30,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}
