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

// Utility per richiedere profilo obbligatorio con redirect
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