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

  useEffect(() => {
    const checkDailyStory = async () => {
      try {
        // 1. Verifica se SU → non mostrare MAI
        const authStatus = await AuthBridge.isAuthenticated();
        const isSU = authStatus.userName === 'superuser' || authStatus.userName === 'Superuser';
        
        if (isSU) {
          console.log('📖 Daily Story: SU detected, skipping overlay');
          setIsLoading(false);
          return;
        }

        // 2. Verifica sessionStorage per evitare ripetizione nella sessione
        if (sessionStorage.getItem('daily_story_shown')) {
          console.log('📖 Daily Story: already shown in this session');
          setIsLoading(false);
          return;
        }

        // 3. Formatta data corrente come "gg mese"
        const today = formatDateToItalian(new Date());
        console.log('📖 Daily Story: checking for date:', today);

        // 4. Cerca racconto in IndexedDB
        const story = await fantasMiaDB.getDailyStoryByDate(today);

        // 5. Se esiste → mostra overlay
        if (story) {
          console.log('📖 Daily Story: found story for today');
          setDailyStory(story);
          setShowOverlay(true);
        } else {
          console.log('📖 Daily Story: no story for today');
        }
      } catch (error) {
        console.error('❌ Daily Story check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkDailyStory();
  }, []);

  const handleClose = useCallback(() => {
    sessionStorage.setItem('daily_story_shown', 'true');
    setShowOverlay(false);
  }, []);

  return { showOverlay, dailyStory, handleClose, isLoading };
};
