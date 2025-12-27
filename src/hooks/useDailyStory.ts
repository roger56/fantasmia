import { useState, useEffect, useCallback } from 'react';
import { fantasMiaDB } from '@/utils/indexedDB';
import { AuthBridge } from '@/utils/authBridge';

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

export const useDailyStory = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [dailyStory, setDailyStory] = useState<DailyStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

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
        
        // 1. Verifica se SU → non mostrare MAI
        const authStatus = await AuthBridge.isAuthenticated();
        console.log('📖 Daily Story: auth status =', authStatus);
        const isSU = authStatus.userName === 'superuser' || authStatus.userName === 'Superuser';
        
        if (isSU) {
          console.log('📖 Daily Story: SU detected, skipping overlay');
          setIsLoading(false);
          return;
        }

        // 2. Verifica sessionStorage per evitare ripetizione nella sessione
        const alreadyShown = sessionStorage.getItem('daily_story_shown');
        console.log('📖 Daily Story: sessionStorage daily_story_shown =', alreadyShown);
        
        if (alreadyShown) {
          console.log('📖 Daily Story: already shown in this session, skipping');
          setIsLoading(false);
          return;
        }

        // 3. Formatta data corrente come "gg mese"
        const today = formatDateToItalian(new Date());
        console.log('📖 Daily Story: searching for date:', today);

        // 4. Cerca racconto in IndexedDB
        const story = await fantasMiaDB.getDailyStoryByDate(today);
        console.log('📖 Daily Story: query result =', story ? 'FOUND' : 'NOT FOUND', story);

        // 5. Se esiste → mostra overlay
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
    sessionStorage.setItem('daily_story_shown', 'true');
    setShowOverlay(false);
  }, []);

  return { showOverlay, dailyStory, handleClose, isLoading, isInitializing };
};
