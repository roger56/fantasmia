import { useState, useEffect, useCallback } from 'react';
import { fantasMiaDB } from '@/utils/indexedDB';
import { AuthBridge } from '@/utils/authBridge';
import { getCurrentProfileId } from '@/utils/profileManager';

const ITALIAN_MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

export interface DailyStory {
  date: string;   // "12 dicembre" - chiave primaria
  story: string;  // racconto breve ASCII
  quote: string;  // massima del giorno
}

export const formatDateToItalian = (date: Date): string => {
  const day = date.getDate();
  const month = ITALIAN_MONTHS[date.getMonth()];
  return `${day} ${month}`;
};

// Genera la chiave sessionStorage per profilo + giorno
const getDailyStorySessionKey = (profileId: string): string => {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return `daily_story_shown:${profileId}:${dateKey}`;
};

export const useDailyStory = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [dailyStory, setDailyStory] = useState<DailyStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  useEffect(() => {
    const checkDailyStory = async () => {
      console.log('📖 Daily Story: === START CHECK ===');
      
      try {
        // 0. Inizializza IndexedDB prima di qualsiasi query
        console.log('📖 Daily Story: initializing IndexedDB...');
        await fantasMiaDB.init();
        console.log('📖 Daily Story: IndexedDB initialized ✓');
        
        // 0.1 Auto-population del bundle
        console.log('📖 Daily Story: ensuring bundle is loaded...');
        await fantasMiaDB.ensureDailyStoriesLoaded();
        console.log('📖 Daily Story: bundle check complete ✓');
        setIsInitializing(false);
        
        // 0.2 Rimuovi vecchia chiave globale (migrazione)
        sessionStorage.removeItem('daily_story_shown');
        
        // 1. Verifica se SU → non mostrare MAI
        const authStatus = await AuthBridge.isAuthenticated();
        console.log('📖 Daily Story: auth status =', authStatus);
        const isSU = authStatus.userName === 'superuser' || authStatus.userName === 'Superuser';
        
        if (isSU) {
          console.log('📖 Daily Story: SU detected, skipping overlay');
          setIsLoading(false);
          return;
        }

        // 2. Recupera profilo corrente
        const profileId = getCurrentProfileId();
        console.log('📖 Daily Story: current profileId =', profileId);
        
        if (!profileId) {
          console.log('📖 Daily Story: no profile, skipping overlay');
          setIsLoading(false);
          return;
        }
        
        setCurrentProfileId(profileId);

        // 3. Verifica sessionStorage per profilo + giorno
        const sessionKey = getDailyStorySessionKey(profileId);
        const alreadyShown = sessionStorage.getItem(sessionKey);
        console.log('📖 Daily Story: sessionKey =', sessionKey, 'alreadyShown =', alreadyShown);
        
        if (alreadyShown) {
          console.log('📖 Daily Story: already shown for this profile today, skipping');
          setIsLoading(false);
          return;
        }

        // 4. Formatta data corrente come "gg mese"
        const today = formatDateToItalian(new Date());
        console.log('📖 Daily Story: searching for date:', today);

        // 5. Cerca racconto in IndexedDB
        const story = await fantasMiaDB.getDailyStoryByDate(today);
        console.log('📖 Daily Story: query result =', story ? 'FOUND' : 'NOT FOUND', story);

        // 6. Se esiste → mostra overlay
        if (story) {
          console.log('📖 Daily Story: ✅ Setting overlay to show');
          setDailyStory(story);
          setShowOverlay(true);
        } else {
          console.log('📖 Daily Story: ❌ No story found for today:', today);
          // Debug: lista tutte le storie disponibili
          try {
            const allStories = await fantasMiaDB.getAllDailyStories();
            console.log('📖 Daily Story: Available stories count:', allStories?.length || 0);
            if (allStories && allStories.length > 0) {
              console.log('📖 Daily Story: First 5 dates:', allStories.slice(0, 5).map((s: any) => s.date));
            }
          } catch (e) {
            console.log('📖 Daily Story: Could not list all stories:', e);
          }
        }
      } catch (error) {
        console.error('❌ Daily Story check error:', error);
      } finally {
        console.log('📖 Daily Story: === END CHECK ===');
        setIsLoading(false);
      }
    };

    checkDailyStory();
  }, []);

  const handleClose = useCallback(() => {
    // Salva chiave specifica per profilo + giorno
    if (currentProfileId) {
      const sessionKey = getDailyStorySessionKey(currentProfileId);
      sessionStorage.setItem(sessionKey, 'true');
      console.log('📖 Daily Story: marked as shown with key:', sessionKey);
    }
    setShowOverlay(false);
  }, [currentProfileId]);

  return { showOverlay, dailyStory, handleClose, isLoading, isInitializing };
};
