/**
 * Hook per la funzione "Conosci la parola?"
 * Gestisce l'icona animata e il quiz delle parole per utenti NSU
 * Supporta italiano e inglese con flow multi-step
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentProfileId, getCurrentProfile, isSuperUser } from '@/utils/profileManager';
import { getCustomWordsIT, getCustomWordsEN, WordEntryIT, WordEntryEN } from '@/utils/customWordsManager';

// Types
export interface WordEntryItalian {
  word: string;
  definition: string;
}

export interface WordEntryEnglish {
  word: string;
  meaningEN: string;
  meaningIT: string;
  translationIT: string;
}

export type SelectedWord = 
  | { language: 'it'; entry: WordEntryItalian }
  | { language: 'en'; entry: WordEntryEnglish };

interface UseConosciLaParolaResult {
  showIcon: boolean;
  showLanguageSelector: boolean;
  showOverlay: boolean;
  selectedWord: SelectedWord | null;
  iconPosition: { x: number; y: number };
  activeLanguages: { it: boolean; en: boolean };
  handleIconClick: () => void;
  handleLanguageSelect: (language: 'it' | 'en') => void;
  closeLanguageSelector: () => void;
  closeOverlay: () => void;
}

const SESSION_KEY_PREFIX = 'fantasmia_clp_session';
const LOGIN_NONCE_KEY = 'fantasmia_login_nonce';
const SETTINGS_KEY = 'fantasmia_wordgame_settings';
const ICON_SIZE = 48;

// Default values
const DEFAULT_ANIMATION_DURATION = 20000;
const DEFAULT_START_DELAY = 5000; // 5s for testing
const DEFAULT_SPEED = 5;

// Logging helper
const logWordGame = (event: string, data: Record<string, unknown>) => {
  console.log(`wordgame:${event}`, data);
};

// Settings interface
interface WordGameSettings {
  enabled: boolean;
  startDelay: number;
  animationDuration: number;
  speed: number;
  languageIT: boolean;
  languageEN: boolean;
}

// Get configurable settings (saved by SU)
const getWordGameSettings = (): WordGameSettings => {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      const parsed = JSON.parse(settings);
      return {
        enabled: parsed.enabled !== false,
        startDelay: (parsed.startDelay || DEFAULT_START_DELAY / 1000) * 1000,
        animationDuration: (parsed.animationDuration || DEFAULT_ANIMATION_DURATION / 1000) * 1000,
        speed: parsed.speed || DEFAULT_SPEED,
        languageIT: parsed.languageIT !== false,
        languageEN: parsed.languageEN !== false
      };
    }
  } catch (e) {
    console.warn('wordgame:settings parse error', e);
  }
  return {
    enabled: true,
    startDelay: DEFAULT_START_DELAY,
    animationDuration: DEFAULT_ANIMATION_DURATION,
    speed: DEFAULT_SPEED,
    languageIT: true,
    languageEN: true
  };
};

// Calculate speed based on age (if no SU override)
const getSpeedFromAge = (age: number | undefined): number => {
  if (!age || age < 6) return DEFAULT_SPEED;
  const base = 5;
  const ageBonus = Math.min(5, (age - 6) * 0.5);
  return Math.min(10, Math.max(1, base + ageBonus));
};

// Load Italian dictionary
const loadItalianDictionary = async (): Promise<WordEntryItalian[]> => {
  const words: WordEntryItalian[] = [];
  
  try {
    // Load from deployed file
    const response = await fetch('/dictionaries/dictionary-it.txt');
    if (response.ok) {
      const text = await response.text();
      const entries = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(';'))
        .map(line => {
          const [word, definition] = line.split(';').map(s => s.trim());
          return { word, definition };
        });
      words.push(...entries);
    }
  } catch (e) {
    console.warn('wordgame: error loading IT dictionary', e);
  }
  
  // Add custom words from IndexedDB
  try {
    const customWords = await getCustomWordsIT();
    words.push(...customWords);
  } catch (e) {
    console.warn('wordgame: error loading custom IT words', e);
  }
  
  logWordGame('dict:it', { count: words.length });
  return words;
};

// Load English dictionary
const loadEnglishDictionary = async (): Promise<WordEntryEnglish[]> => {
  const words: WordEntryEnglish[] = [];
  
  try {
    // Load from deployed file
    const response = await fetch('/dictionaries/dictionary-en.txt');
    if (response.ok) {
      const text = await response.text();
      const entries = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(';'))
        .map(line => {
          const parts = line.split(';').map(s => s.trim());
          if (parts.length >= 4) {
            return {
              word: parts[0],
              meaningEN: parts[1],
              meaningIT: parts[2],
              translationIT: parts[3]
            };
          }
          return null;
        })
        .filter((entry): entry is WordEntryEnglish => entry !== null);
      words.push(...entries);
    }
  } catch (e) {
    console.warn('wordgame: error loading EN dictionary', e);
  }
  
  // Add custom words from IndexedDB
  try {
    const customWords = await getCustomWordsEN();
    words.push(...customWords.map(w => ({
      word: w.word,
      meaningEN: w.meaningEN,
      meaningIT: w.meaningIT,
      translationIT: w.translationIT
    })));
  } catch (e) {
    console.warn('wordgame: error loading custom EN words', e);
  }
  
  logWordGame('dict:en', { count: words.length });
  return words;
};

export const useConosciLaParola = (): UseConosciLaParolaResult => {
  const [showIcon, setShowIcon] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [iconPosition, setIconPosition] = useState({ x: 100, y: 100 });
  const [activeLanguages, setActiveLanguages] = useState({ it: true, en: true });
  
  const velocityRef = useRef({ vx: 2, vy: 1.5 });
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const settingsRef = useRef(getWordGameSettings());

  // Check if user is NSU
  const checkIsNSU = useCallback((): boolean => {
    const profileId = getCurrentProfileId();
    const isSU = isSuperUser();
    
    logWordGame('init', { 
      user: profileId, 
      role: isSU ? 'SU' : 'NSU'
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

  const getSessionKey = useCallback((): string => {
    const profileId = getCurrentProfileId() || 'anonymous';
    let nonce = sessionStorage.getItem(LOGIN_NONCE_KEY);
    if (!nonce) {
      nonce = String(Date.now());
      sessionStorage.setItem(LOGIN_NONCE_KEY, nonce);
    }
    return `${SESSION_KEY_PREFIX}:${profileId}:${nonce}`;
  }, []);

  const isAlreadyShownThisSession = useCallback((): boolean => {
    const key = getSessionKey();
    const sessionFlag = sessionStorage.getItem(key);
    const alreadyShown = sessionFlag === 'true';
    if (alreadyShown) {
      logWordGame('showIcon', { value: false, reason: 'already_shown_this_session' });
    }
    return alreadyShown;
  }, [getSessionKey]);

  const markAsShown = useCallback(() => {
    const key = getSessionKey();
    sessionStorage.setItem(key, 'true');
  }, [getSessionKey]);

  // Animate icon bouncing off edges
  const animate = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const { animationDuration } = settingsRef.current;
    
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
      const minY = 60;
      
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
    const startX = Math.random() * (window.innerWidth - ICON_SIZE * 2) + ICON_SIZE;
    const startY = Math.random() * (window.innerHeight - ICON_SIZE * 2 - 100) + 100;
    setIconPosition({ x: startX, y: startY });
    
    // Calculate speed
    const settings = settingsRef.current;
    const profile = getCurrentProfile();
    const speed = settings.speed || getSpeedFromAge(profile?.age);
    const baseSpeed = 0.5 + (speed * 0.3);
    
    const angle = Math.random() * Math.PI * 2;
    velocityRef.current = {
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed
    };
    
    startTimeRef.current = Date.now();
    setShowIcon(true);
    logWordGame('showIcon', { value: true, reason: 'animation_started', speed });
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Initialize on mount
  useEffect(() => {
    settingsRef.current = getWordGameSettings();
    const settings = settingsRef.current;
    
    setActiveLanguages({
      it: settings.languageIT,
      en: settings.languageEN
    });
    
    logWordGame('settings', { 
      enabled: settings.enabled,
      startDelay: settings.startDelay / 1000 + 's',
      animationDuration: settings.animationDuration / 1000 + 's',
      speed: settings.speed,
      languages: { it: settings.languageIT, en: settings.languageEN }
    });
    
    // Check if feature is enabled
    if (!settings.enabled) {
      logWordGame('showIcon', { value: false, reason: 'feature_disabled' });
      return;
    }
    
    // Check if at least one language is active
    if (!settings.languageIT && !settings.languageEN) {
      logWordGame('showIcon', { value: false, reason: 'no_languages_active' });
      return;
    }
    
    if (!checkIsNSU() || isAlreadyShownThisSession()) {
      return;
    }

    logWordGame('showIcon', { value: 'pending', reason: 'timer_started', delay: settings.startDelay / 1000 + 's' });
    
    timeoutRef.current = setTimeout(() => {
      startAnimation();
    }, settings.startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [checkIsNSU, isAlreadyShownThisSession, startAnimation]);

  // Handle icon click - show language selector
  const handleIconClick = useCallback(() => {
    setShowIcon(false);
    markAsShown();
    logWordGame('interaction', { event: 'icon_clicked' });
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const settings = settingsRef.current;
    // If only one language active, skip selector
    if (settings.languageIT && !settings.languageEN) {
      loadItalianDictionary().then(words => {
        if (words.length > 0) {
          const randomWord = words[Math.floor(Math.random() * words.length)];
          setSelectedWord({ language: 'it', entry: randomWord });
          setShowOverlay(true);
        }
      });
    } else if (!settings.languageIT && settings.languageEN) {
      loadEnglishDictionary().then(words => {
        if (words.length > 0) {
          const randomWord = words[Math.floor(Math.random() * words.length)];
          setSelectedWord({ language: 'en', entry: randomWord });
          setShowOverlay(true);
        }
      });
    } else {
      setShowLanguageSelector(true);
    }
  }, [markAsShown]);

  // Handle language selection
  const handleLanguageSelect = useCallback(async (language: 'it' | 'en') => {
    setShowLanguageSelector(false);
    logWordGame('interaction', { event: 'language_selected', language });
    
    if (language === 'it') {
      const words = await loadItalianDictionary();
      if (words.length > 0) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setSelectedWord({ language: 'it', entry: randomWord });
        setShowOverlay(true);
      }
    } else {
      const words = await loadEnglishDictionary();
      if (words.length > 0) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setSelectedWord({ language: 'en', entry: randomWord });
        setShowOverlay(true);
      }
    }
  }, []);

  // Close language selector
  const closeLanguageSelector = useCallback(() => {
    setShowLanguageSelector(false);
    logWordGame('interaction', { event: 'language_selector_closed' });
  }, []);

  // Close overlay
  const closeOverlay = useCallback(() => {
    setShowOverlay(false);
    setSelectedWord(null);
    logWordGame('interaction', { event: 'overlay_closed' });
  }, []);

  return {
    showIcon,
    showLanguageSelector,
    showOverlay,
    selectedWord,
    iconPosition,
    activeLanguages,
    handleIconClick,
    handleLanguageSelect,
    closeLanguageSelector,
    closeOverlay
  };
};
