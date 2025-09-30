// Event Debouncing Utility for Performance Optimization
// Prevents excessive re-renders from rapid event dispatches

interface DebouncedEventCache {
  [eventName: string]: {
    timeout: number;
    pendingDetail?: any;
  };
}

const cache: DebouncedEventCache = {};

/**
 * Dispatch a custom event with debouncing to prevent performance issues
 * @param eventName - The name of the custom event
 * @param detail - The detail object to pass with the event
 * @param delay - Debounce delay in milliseconds (default: 150ms)
 */
export function dispatchDebouncedEvent(
  eventName: string,
  detail?: any,
  delay: number = 150
): void {
  // Clear existing timeout if present
  if (cache[eventName]) {
    clearTimeout(cache[eventName].timeout);
  }

  // Set new timeout
  cache[eventName] = {
    timeout: window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
      delete cache[eventName];
      
      if (import.meta.env.DEV) {
        console.debug(`[event-debounced] ${eventName}`, detail || '');
      }
    }, delay),
    pendingDetail: detail
  };
}

/**
 * Dispatch an event immediately, canceling any pending debounced event
 * Use this for critical events that must fire immediately
 */
export function dispatchImmediateEvent(
  eventName: string,
  detail?: any
): void {
  // Cancel pending debounced event if exists
  if (cache[eventName]) {
    clearTimeout(cache[eventName].timeout);
    delete cache[eventName];
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
  
  if (import.meta.env.DEV) {
    console.debug(`[event-immediate] ${eventName}`, detail || '');
  }
}

/**
 * Clear all pending debounced events
 * Useful for cleanup on unmount
 */
export function clearAllDebouncedEvents(): void {
  Object.values(cache).forEach(({ timeout }) => clearTimeout(timeout));
  Object.keys(cache).forEach(key => delete cache[key]);
}
