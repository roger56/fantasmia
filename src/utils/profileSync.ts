// Profile Sync Manager per Fantas-Mia V2
// Fonte UNICA per l'elenco profili: IndexedDB (primaria) con fallback localStorage

import { fantasMiaDB } from './indexedDB';

export interface SyncedProfile {
  id: string;
  name: string;
  email?: string;
  password?: string;
  age?: number;
  lastAccess?: string;
  user_type?: string;
  created_at?: string;
  unreadMessages?: any[];
}

interface ProfileLoadResult {
  profiles: SyncedProfile[];
  source: 'indexeddb' | 'localstorage' | 'merged';
  count: number;
  ids: string[];
}

/**
 * Carica i profili da IndexedDB come fonte primaria.
 * Se IndexedDB è vuoto, usa localStorage come fallback e migra i dati.
 * Logga sempre: profiles:source, profiles:count, profiles:ids
 */
export const loadProfilesUnified = async (): Promise<ProfileLoadResult> => {
  try {
    await fantasMiaDB.init();
    
    // 1. Leggi da IndexedDB (fonte primaria)
    const indexedDBProfiles = await fantasMiaDB.getAllProfiles();
    
    // 2. Leggi da localStorage (backup/legacy)
    const localStorageUsers: SyncedProfile[] = JSON.parse(
      localStorage.getItem('fantasmia_users') || '[]'
    );
    
    console.log('📊 profiles:indexeddb_count=' + indexedDBProfiles.length);
    console.log('📊 profiles:localstorage_count=' + localStorageUsers.length);
    
    let finalProfiles: SyncedProfile[] = [];
    let source: 'indexeddb' | 'localstorage' | 'merged' = 'indexeddb';
    
    if (indexedDBProfiles.length > 0) {
      // IndexedDB ha dati → è la fonte di verità
      finalProfiles = indexedDBProfiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        user_type: p.user_type,
        created_at: p.created_at,
        lastAccess: p.last_access,
        // Recupera password da localStorage se esiste (per autenticazione)
        password: localStorageUsers.find(u => u.id === p.id)?.password,
        age: localStorageUsers.find(u => u.id === p.id)?.age,
        unreadMessages: localStorageUsers.find(u => u.id === p.id)?.unreadMessages
      }));
      
      // Verifica se ci sono profili in localStorage che mancano in IndexedDB
      const indexedDBIds = new Set(indexedDBProfiles.map((p: any) => p.id));
      const missingInIndexedDB = localStorageUsers.filter(u => !indexedDBIds.has(u.id));
      
      if (missingInIndexedDB.length > 0) {
        console.log('🔄 profiles:merging - trovati ' + missingInIndexedDB.length + ' profili in localStorage mancanti in IndexedDB');
        
        // Migra i profili mancanti in IndexedDB
        for (const user of missingInIndexedDB) {
          const profileData = {
            id: user.id,
            name: user.name,
            email: user.email || '',
            user_type: user.user_type || 'user',
            created_at: user.created_at || new Date().toISOString(),
            last_access: user.lastAccess || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await fantasMiaDB.saveProfile(profileData);
          finalProfiles.push(user);
          console.log('✅ profiles:migrated - ' + user.name + ' (id: ' + user.id + ')');
        }
        
        source = 'merged';
      }
      
      // Sincronizza localStorage con IndexedDB per mantenere coerenza
      syncLocalStorageFromProfiles(finalProfiles);
      
    } else if (localStorageUsers.length > 0) {
      // IndexedDB vuoto ma localStorage ha dati → migra tutto
      console.log('🔄 profiles:migrating_all - IndexedDB vuoto, migrazione da localStorage');
      
      for (const user of localStorageUsers) {
        const profileData = {
          id: user.id,
          name: user.name,
          email: user.email || '',
          user_type: user.user_type || 'user',
          created_at: user.created_at || new Date().toISOString(),
          last_access: user.lastAccess || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await fantasMiaDB.saveProfile(profileData);
      }
      
      finalProfiles = localStorageUsers;
      source = 'localstorage';
    }
    
    // Ordina per ultimo accesso (più recente prima)
    finalProfiles.sort((a, b) => {
      const dateA = a.lastAccess ? new Date(a.lastAccess).getTime() : 0;
      const dateB = b.lastAccess ? new Date(b.lastAccess).getTime() : 0;
      return dateB - dateA;
    });
    
    const result: ProfileLoadResult = {
      profiles: finalProfiles,
      source,
      count: finalProfiles.length,
      ids: finalProfiles.map(p => p.id)
    };
    
    // LOG DIAGNOSTICO RICHIESTO
    console.log(`📋 profiles:source=${result.source}`);
    console.log(`📋 profiles:count=${result.count}`);
    console.log(`📋 profiles:ids=[${result.ids.join(', ')}]`);
    console.log(`📋 profiles:names=[${finalProfiles.map(p => p.name).join(', ')}]`);
    
    return result;
    
  } catch (error) {
    console.error('❌ profiles:error', error);
    
    // Fallback completo a localStorage in caso di errore IndexedDB
    const localStorageUsers: SyncedProfile[] = JSON.parse(
      localStorage.getItem('fantasmia_users') || '[]'
    );
    
    const result: ProfileLoadResult = {
      profiles: localStorageUsers,
      source: 'localstorage',
      count: localStorageUsers.length,
      ids: localStorageUsers.map(p => p.id)
    };
    
    console.log(`📋 profiles:source=${result.source} (fallback after error)`);
    console.log(`📋 profiles:count=${result.count}`);
    console.log(`📋 profiles:ids=[${result.ids.join(', ')}]`);
    
    return result;
  }
};

/**
 * Sincronizza localStorage con i profili forniti per mantenere coerenza.
 * Mantiene i dati extra (password, age, unreadMessages) già presenti.
 */
const syncLocalStorageFromProfiles = (profiles: SyncedProfile[]): void => {
  const existingUsers: SyncedProfile[] = JSON.parse(
    localStorage.getItem('fantasmia_users') || '[]'
  );
  
  const mergedUsers = profiles.map(profile => {
    const existing = existingUsers.find(u => u.id === profile.id);
    return {
      ...profile,
      // Preserva dati extra da localStorage
      password: profile.password || existing?.password,
      age: profile.age || existing?.age,
      unreadMessages: profile.unreadMessages || existing?.unreadMessages
    };
  });
  
  localStorage.setItem('fantasmia_users', JSON.stringify(mergedUsers));
  console.log('✅ profiles:localstorage_synced - ' + mergedUsers.length + ' profili');
};

/**
 * Elimina un profilo da TUTTE le fonti (IndexedDB + localStorage).
 * Da usare nelle operazioni di cancellazione.
 */
export const deleteProfileFromAllSources = async (profileId: string): Promise<void> => {
  // 1. Elimina da IndexedDB
  try {
    await fantasMiaDB.init();
    await fantasMiaDB.deleteProfile(profileId);
    console.log('✅ profiles:deleted_from_indexeddb - ' + profileId);
  } catch (error) {
    console.error('❌ profiles:delete_indexeddb_error', error);
  }
  
  // 2. Elimina da localStorage fantasmia_users
  try {
    const localUsers = JSON.parse(localStorage.getItem('fantasmia_users') || '[]');
    const filtered = localUsers.filter((u: any) => u.id !== profileId);
    localStorage.setItem('fantasmia_users', JSON.stringify(filtered));
    console.log('✅ profiles:deleted_from_localstorage - ' + profileId);
  } catch (error) {
    console.error('❌ profiles:delete_localstorage_error', error);
  }
  
  // 3. Elimina archivio storie utente
  localStorage.removeItem(`fantasmia_user_archive_${profileId}`);
  
  console.log('✅ profiles:deleted_from_all_sources - ' + profileId);
};

/**
 * Salva un profilo in TUTTE le fonti (IndexedDB + localStorage).
 * Da usare nelle operazioni di creazione/aggiornamento.
 */
export const saveProfileToAllSources = async (profile: SyncedProfile): Promise<void> => {
  // 1. Salva in IndexedDB
  try {
    await fantasMiaDB.init();
    await fantasMiaDB.saveProfile({
      id: profile.id,
      name: profile.name,
      email: profile.email || '',
      user_type: profile.user_type || 'user',
      created_at: profile.created_at || new Date().toISOString(),
      last_access: profile.lastAccess || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('✅ profiles:saved_to_indexeddb - ' + profile.name);
  } catch (error) {
    console.error('❌ profiles:save_indexeddb_error', error);
  }
  
  // 2. Salva/aggiorna in localStorage
  try {
    const localUsers = JSON.parse(localStorage.getItem('fantasmia_users') || '[]');
    const existingIndex = localUsers.findIndex((u: any) => u.id === profile.id);
    
    if (existingIndex >= 0) {
      localUsers[existingIndex] = { ...localUsers[existingIndex], ...profile };
    } else {
      localUsers.push(profile);
    }
    
    localStorage.setItem('fantasmia_users', JSON.stringify(localUsers));
    console.log('✅ profiles:saved_to_localstorage - ' + profile.name);
  } catch (error) {
    console.error('❌ profiles:save_localstorage_error', error);
  }
};
