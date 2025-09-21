// Profile Manager per Fantas-Mia V2
// Fonte UNICA per l'identità del profilo attivo

import { toast } from '@/hooks/use-toast';

export const getCurrentProfileId = (): string | null => {
  return localStorage.getItem('current_profile_id');
};

export const setCurrentProfileId = (profileId: string): void => {
  localStorage.setItem('current_profile_id', profileId);
};

export const clearCurrentProfile = (): void => {
  localStorage.removeItem('current_profile_id');
};

// Ottiene il profilo attivo dalla stessa fonte usata in /profiles
export const getCurrentProfile = () => {
  const profileId = getCurrentProfileId();
  if (!profileId) return null;
  
  // Per compatibilità con il sistema esistente
  const users = JSON.parse(localStorage.getItem('fantasmia_users') || '[]');
  return users.find((user: any) => user.id === profileId) || null;
};

// Verifica se l'utente corrente è Superuser
export const isSuperUser = (): boolean => {
  const profile = getCurrentProfile();
  return profile?.userType === 'superuser' || false;
};

// Verifica proprietà storia con controllo per Superuser
export const canAccessStory = (story: { ownerProfileId: string }): boolean => {
  if (isSuperUser()) return true; // SU può accedere a tutto
  
  const currentProfileId = getCurrentProfileId();
  return currentProfileId === story.ownerProfileId;
};

// Utility per richiedere profilo obbligatorio con redirect (NON usare in /debug-indexeddb)
export const requireCurrentProfile = (): string => {
  const profileId = getCurrentProfileId();
  
  if (!profileId) {
    toast({
      title: "Profilo richiesto",
      description: "Seleziona un profilo per continuare",
      variant: "destructive"
    });
    
    // Redirect a /profiles dopo un breve delay per permettere al toast di mostrarsi
    setTimeout(() => {
      window.location.href = '/profiles';
    }, 1000);
    
    throw new Error('Nessun profilo selezionato');
  }
  
  return profileId;
};

// Utility per creare profilo demo (solo per debug)
export const createDemoProfile = async (): Promise<string> => {
  const { fantasMiaDB } = await import('./indexedDB');
  await fantasMiaDB.init();
  
  const demoProfile = {
    id: crypto.randomUUID(),
    name: 'debug-user',
    created_at: new Date().toISOString(),
    last_access: new Date().toISOString()
  };
  
  await fantasMiaDB.saveProfile(demoProfile);
  setCurrentProfileId(demoProfile.id);
  
  return demoProfile.id;
};