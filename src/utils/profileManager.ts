// Profile Manager per Fantas-Mia V2
// Gestisce il profilo attivo corrente

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