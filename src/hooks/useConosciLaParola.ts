/**
 * Hook per la funzione "Conosci la parola?"
 * Gestisce l'icona animata e il quiz delle parole per utenti NSU
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDatasetWithVersion } from '@/utils/contentUpdateManager';
import { getCurrentProfileId, isSuperUser } from '@/utils/profileManager';

interface WordEntry {
  word: string;
  definition: string;
}

interface WordsData {
  words: WordEntry[];
}

interface UseConosciLaParolaResult {
  showIcon: boolean;
  currentWord: WordEntry | null;
  showOverlay: boolean;
  showDefinition: boolean;
  iconPosition: { x: number; y: number };
  handleIconClick: () => void;
  handleYes: () => void;
  handleNo: () => void;
  closeOverlay: () => void;
}

const SESSION_KEY = 'fantasmia_clp_session';
const ICON_SIZE = 48;
const SETTINGS_KEY = 'fantasmia_wordgame_settings';

// Default values (can be overridden by SU settings)
const DEFAULT_ANIMATION_DURATION = 20000; // 20 seconds
const DEFAULT_START_DELAY = 5000; // 5 seconds for TESTING (change to 120000 for production)

// Retry config
const MAX_DICT_RETRIES = 3;
const DICT_RETRY_INTERVAL = 2000;

// Logging helper
const logWordGame = (event: string, data: Record<string, unknown>) => {
  console.log(`wordgame:${event}`, data);
};

// Get configurable settings (saved by SU)
const getWordGameSettings = (): { startDelay: number; animationDuration: number } => {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      const parsed = JSON.parse(settings);
      return {
        startDelay: (parsed.startDelay || DEFAULT_START_DELAY / 1000) * 1000,
        animationDuration: (parsed.animationDuration || DEFAULT_ANIMATION_DURATION / 1000) * 1000
      };
    }
  } catch (e) {
    console.warn('wordgame:settings parse error', e);
  }
  return { startDelay: DEFAULT_START_DELAY, animationDuration: DEFAULT_ANIMATION_DURATION };
};

// Load external dictionary from /dizionario.txt (optional supplement)
const loadExternalDictionary = async (): Promise<WordEntry[]> => {
  try {
    const response = await fetch('/dizionario.txt');
    if (response.ok) {
      const text = await response.text();
      const entries = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(';'))
        .map(line => {
          const [word, definition] = line.split(';').map(s => s.trim());
          return { word, definition };
        });
      logWordGame('externalDict', { loaded: true, count: entries.length });
      return entries;
    }
  } catch (e) {
    // File doesn't exist or error - this is OK, it's optional
  }
  return [];
};

export const useConosciLaParola = (): UseConosciLaParolaResult => {
  const [showIcon, setShowIcon] = useState(false);
  const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);
  const [iconPosition, setIconPosition] = useState({ x: 100, y: 100 });
  
  const velocityRef = useRef({ vx: 2, vy: 1.5 });
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const settingsRef = useRef(getWordGameSettings());

  // Check if user is NSU (not superuser) with logging
  const checkIsNSU = useCallback((): boolean => {
    const profileId = getCurrentProfileId();
    const isSU = isSuperUser();
    const dailyKey = new Date().toISOString().split('T')[0];
    
    logWordGame('init', { 
      user: profileId, 
      role: isSU ? 'SU' : 'NSU',
      dailyKey
    });
    
    if (!profileId) {
      logWordGame('showIcon', { value: false, reason: 'no_profile' });
      return false;
    }
    
    if (isSU) {
      logWordGame('showIcon', { value: false, reason: 'is_superuser' });
      return false;
    }
    
    return true;
  }, []);

  // Check if already shown this session
  const isAlreadyShownThisSession = useCallback((): boolean => {
    const sessionFlag = sessionStorage.getItem(SESSION_KEY);
    const alreadyShown = sessionFlag === 'true';
    if (alreadyShown) {
      logWordGame('showIcon', { value: false, reason: 'already_shown_this_session' });
    }
    return alreadyShown;
  }, []);

  // Mark as shown for this session
  const markAsShown = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  // Load random word from dictionary with retry logic
  const loadRandomWord = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      // Load both sources
      const [jsonData, externalWords] = await Promise.all([
        fetchDatasetWithVersion<WordsData>('conosci_la_parola'),
        loadExternalDictionary()
      ]);
      
      // Combine words from both sources
      const jsonWords = jsonData?.words || [];
      const allWords = [...jsonWords, ...externalWords];
      
      if (allWords.length > 0) {
        logWordGame('dict', { 
          loaded: true, 
          count: allWords.length,
          jsonCount: jsonWords.length,
          externalCount: externalWords.length
        });
        const randomIndex = Math.floor(Math.random() * allWords.length);
        setCurrentWord(allWords[randomIndex]);
        return true;
      }
      
      // Retry logic if no words found
      if (retryCount < MAX_DICT_RETRIES) {
        logWordGame('dict', { loaded: false, retry: retryCount + 1, maxRetries: MAX_DICT_RETRIES });
        await new Promise(r => setTimeout(r, DICT_RETRY_INTERVAL));
        return loadRandomWord(retryCount + 1);
      }
      
      logWordGame('dict', { loaded: false, reason: 'no_words_after_retries' });
      return false;
    } catch (error) {
      // Retry on error
      if (retryCount < MAX_DICT_RETRIES) {
        logWordGame('dict', { loaded: false, error: String(error), retry: retryCount + 1 });
        await new Promise(r => setTimeout(r, DICT_RETRY_INTERVAL));
        return loadRandomWord(retryCount + 1);
      }
      logWordGame('dict', { loaded: false, reason: 'error_after_retries', error: String(error) });
      return false;
    }
  }, []);

  // Animate icon bouncing off edges
  const animate = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const { animationDuration } = settingsRef.current;
    
    // Stop after animation duration
    if (elapsed >= animationDuration) {
      setShowIcon(false);
      markAsShown();
      logWordGame('animation', { event: 'ended', reason: 'timeout' });
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    setIconPosition(prev => {
      let newX = prev.x + velocityRef.current.vx;
      let newY = prev.y + velocityRef.current.vy;
      
      const maxX = window.innerWidth - ICON_SIZE - 20;
      const maxY = window.innerHeight - ICON_SIZE - 20;
      const minX = 20;
      const minY = 60; // Account for top nav
      
      // Bounce off edges
      if (newX <= minX || newX >= maxX) {
        velocityRef.current.vx *= -1;
        newX = Math.max(minX, Math.min(maxX, newX));
      }
      if (newY <= minY || newY >= maxY) {
        velocityRef.current.vy *= -1;
        newY = Math.max(minY, Math.min(maxY, newY));
      }
      
      return { x: newX, y: newY };
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [markAsShown]);

  // Start the animation
  const startAnimation = useCallback(() => {
    // Random starting position
    const startX = Math.random() * (window.innerWidth - ICON_SIZE * 2) + ICON_SIZE;
    const startY = Math.random() * (window.innerHeight - ICON_SIZE * 2 - 100) + 100;
    setIconPosition({ x: startX, y: startY });
    
    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 1; // Speed between 1.5 and 2.5
    velocityRef.current = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
    
    startTimeRef.current = Date.now();
    setShowIcon(true);
    logWordGame('showIcon', { value: true, reason: 'animation_started' });
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Initialize on mount
  useEffect(() => {
    // Reload settings in case they changed
    settingsRef.current = getWordGameSettings();
    const { startDelay } = settingsRef.current;
    
    logWordGame('settings', { 
      startDelay: startDelay / 1000 + 's', 
      animationDuration: settingsRef.current.animationDuration / 1000 + 's' 
    });
    
    // Only for NSU, not already shown this session
    if (!checkIsNSU() || isAlreadyShownThisSession()) {
      return;
    }

    logWordGame('showIcon', { value: 'pending', reason: 'loading_dictionary' });

    // Load word first (with retry)
    loadRandomWord().then(success => {
      if (success) {
        logWordGame('showIcon', { value: 'pending', reason: 'timer_started', delay: startDelay / 1000 + 's' });
        // Start after delay
        timeoutRef.current = setTimeout(() => {
          startAnimation();
        }, startDelay);
      } else {
        logWordGame('showIcon', { value: false, reason: 'dictionary_load_failed' });
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [checkIsNSU, isAlreadyShownThisSession, loadRandomWord, startAnimation]);

  // Handle icon click
  const handleIconClick = useCallback(() => {
    setShowIcon(false);
    markAsShown();
    setShowOverlay(true);
    logWordGame('interaction', { event: 'icon_clicked' });
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [markAsShown]);

  // Handle YES response
  const handleYes = useCallback(() => {
    setShowOverlay(false);
    setShowDefinition(false);
    logWordGame('interaction', { event: 'answer_yes' });
  }, []);

  // Handle NO response
  const handleNo = useCallback(() => {
    setShowDefinition(true);
    logWordGame('interaction', { event: 'answer_no_show_definition' });
  }, []);

  // Close overlay (after seeing definition)
  const closeOverlay = useCallback(() => {
    setShowOverlay(false);
    setShowDefinition(false);
    logWordGame('interaction', { event: 'overlay_closed' });
  }, []);

  return {
    showIcon,
    currentWord,
    showOverlay,
    showDefinition,
    iconPosition,
    handleIconClick,
    handleYes,
    handleNo,
    closeOverlay
  };
};
