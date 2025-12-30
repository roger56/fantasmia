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
const ANIMATION_DURATION = 20000; // 20 seconds
const START_DELAY = 120000; // 2 minutes (production)

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

  // Check if user is NSU (not superuser)
  const isNSU = useCallback((): boolean => {
    const profileId = getCurrentProfileId();
    if (!profileId) {
      return false; // No profile = don't show
    }
    return !isSuperUser();
  }, []);

  // Check if already shown this session
  const isAlreadyShownThisSession = useCallback((): boolean => {
    const sessionFlag = sessionStorage.getItem(SESSION_KEY);
    return sessionFlag === 'true';
  }, []);

  // Mark as shown for this session
  const markAsShown = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  // Load random word from dictionary
  const loadRandomWord = useCallback(async () => {
    try {
      const data = await fetchDatasetWithVersion<WordsData>('conosci_la_parola');
      if (data && data.words && data.words.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.words.length);
        setCurrentWord(data.words[randomIndex]);
        return true;
      }
    } catch (error) {
      console.error('ConosciLaParola: Error loading words:', error);
    }
    return false;
  }, []);

  // Animate icon bouncing off edges
  const animate = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    
    // Stop after animation duration
    if (elapsed >= ANIMATION_DURATION) {
      setShowIcon(false);
      markAsShown();
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
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Initialize on mount
  useEffect(() => {
    // Only for NSU, not already shown this session
    if (!isNSU() || isAlreadyShownThisSession()) {
      return;
    }

    // Load word first
    loadRandomWord().then(success => {
      if (success) {
        // Start after delay
        timeoutRef.current = setTimeout(() => {
          startAnimation();
        }, START_DELAY);
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
  }, [isNSU, isAlreadyShownThisSession, loadRandomWord, startAnimation]);

  // Handle icon click
  const handleIconClick = useCallback(() => {
    setShowIcon(false);
    markAsShown();
    setShowOverlay(true);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [markAsShown]);

  // Handle YES response
  const handleYes = useCallback(() => {
    setShowOverlay(false);
    setShowDefinition(false);
  }, []);

  // Handle NO response
  const handleNo = useCallback(() => {
    setShowDefinition(true);
  }, []);

  // Close overlay (after seeing definition)
  const closeOverlay = useCallback(() => {
    setShowOverlay(false);
    setShowDefinition(false);
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
