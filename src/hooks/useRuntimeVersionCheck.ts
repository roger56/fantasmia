import { useState, useEffect, useCallback } from 'react';

interface RuntimeVersion {
  buildId: string;
  publishedAt: string;
}

interface UseRuntimeVersionCheckResult {
  isCheckingVersion: boolean;
  needsUpdate: boolean;
  isUpdating: boolean;
  timeoutReached: boolean;
  startUpdate: () => Promise<void>;
}

const STORAGE_KEY_BUILD = 'fantasmia_last_build_id';

export const useRuntimeVersionCheck = (): UseRuntimeVersionCheckResult => {
  const [isCheckingVersion, setIsCheckingVersion] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const clearCachesAndSW = async (): Promise<void> => {
    console.log('RuntimeVersionCheck: Clearing caches and SW...');
    
    // 1. Clear Cache Storage
    if ('caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log('RuntimeVersionCheck: Cleared', cacheKeys.length, 'caches');
      } catch (error) {
        console.error('RuntimeVersionCheck: Error clearing caches:', error);
      }
    }

    // 2. Update/Unregister Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('RuntimeVersionCheck: Unregistered SW');
        }
      } catch (error) {
        console.error('RuntimeVersionCheck: Error with SW:', error);
      }
    }

    // 3. Clear seed version keys to force reimport
    localStorage.removeItem('ag_seed_version');
    localStorage.removeItem('airots_seed_version');
    localStorage.removeItem('fantasmia_content_versions');
    console.log('RuntimeVersionCheck: Cleared seed version keys');
  };

  const startUpdate = useCallback(async (): Promise<void> => {
    setIsUpdating(true);
    
    // Start timeout timer
    const timeoutId = setTimeout(() => {
      setTimeoutReached(true);
    }, 15000); // 15 seconds

    try {
      await clearCachesAndSW();
      
      // Update stored build ID before reload
      const response = await fetch('/runtime-version.json', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const { buildId } = await response.json();
        localStorage.setItem(STORAGE_KEY_BUILD, buildId);
      }
      
      clearTimeout(timeoutId);
      
      // Reload
      console.log('RuntimeVersionCheck: Reloading...');
      window.location.reload();
    } catch (error) {
      console.error('RuntimeVersionCheck: Update failed:', error);
      clearTimeout(timeoutId);
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Always fetch and compare buildId on every app opening
        const response = await fetch('/runtime-version.json', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
          console.log('RuntimeVersionCheck: Version file not found, skipping');
          setIsCheckingVersion(false);
          setNeedsUpdate(false);
          return;
        }

        const { buildId } = await response.json() as RuntimeVersion;
        const storedBuildId = localStorage.getItem(STORAGE_KEY_BUILD);

        console.log('RuntimeVersionCheck: Current buildId:', buildId, 'Stored:', storedBuildId);

        if (!storedBuildId || storedBuildId !== buildId) {
          // New version detected - needs update
          console.log('RuntimeVersionCheck: New version detected, needs update');
          setNeedsUpdate(true);
          setIsCheckingVersion(false);
        } else {
          // Same version - proceed normally
          console.log('RuntimeVersionCheck: Same version, proceeding');
          setNeedsUpdate(false);
          setIsCheckingVersion(false);
        }
      } catch (error) {
        console.error('RuntimeVersionCheck: Error checking version:', error);
        setIsCheckingVersion(false);
        setNeedsUpdate(false);
      }
    };

    checkVersion();
  }, []);

  return {
    isCheckingVersion,
    needsUpdate,
    isUpdating,
    timeoutReached,
    startUpdate
  };
};

export default useRuntimeVersionCheck;
