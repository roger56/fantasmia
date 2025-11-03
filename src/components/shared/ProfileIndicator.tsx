import React, { useState, useEffect } from 'react';
import { User, Move, Minimize, Maximize2 } from 'lucide-react';
import { getCurrentProfile } from '@/utils/profileManager';

const MOBILE_BREAKPOINT = 992;

const ProfileIndicator: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('profile-indicator-position');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('profile-indicator-minimized');
    return saved ? JSON.parse(saved) : false;
  });

  // Helper function con gerarchia di priorità per recuperare il nome utente
  const getUserName = (): string | null => {
    // PRIORITÀ 1: Check bridged session da AuthBridge (utente normale loggato)
    try {
      const bridgedSessionData = localStorage.getItem('fantasmia_supabase_session');
      if (bridgedSessionData) {
        const session = JSON.parse(bridgedSessionData);
        if (session.expires_at > Date.now()) {
          return session.user?.user_metadata?.name || null;
        }
      }
    } catch (error) {
      console.warn('Error parsing bridged session:', error);
    }
    
    // PRIORITÀ 2: Profilo da IndexedDB (getCurrentProfile)
    const profile = getCurrentProfile();
    if (profile?.name) {
      return profile.name;
    }
    
    // PRIORITÀ 3: Check se c'è una sessione superuser attiva (solo se nessun utente normale)
    const superuserSession = localStorage.getItem('superuser-session');
    const superuserExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (superuserSession && superuserExpiry) {
      const expiryTime = parseInt(superuserExpiry);
      if (expiryTime > Date.now()) {
        return 'superuser';
      }
    }
    
    return null;
  };

  useEffect(() => {
    const checkUser = () => {
      const name = getUserName();
      if (name) {
        setUserName(name);
      }
    };

    checkUser();
    
    // Polling ogni 1 secondo per aggiornamenti in tempo reale
    const interval = setInterval(checkUser, 1000);

    // Responsive handler
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable drag on mobile
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: position.x,
      elementY: position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isMobile) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - 200; // Approximate element width
      const maxY = window.innerHeight - 50; // Approximate element height
      const minX = -window.innerWidth + 200;
      const minY = -window.innerHeight + 50;
      
      const newX = Math.max(minX, Math.min(maxX, dragStart.elementX + deltaX));
      const newY = Math.max(minY, Math.min(maxY, dragStart.elementY + deltaY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    localStorage.setItem('profile-indicator-position', JSON.stringify(position));
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    localStorage.setItem('profile-indicator-minimized', JSON.stringify(true));
  };

  const handleExpand = () => {
    setIsMinimized(false);
    localStorage.setItem('profile-indicator-minimized', JSON.stringify(false));
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!userName) return null;

  // Mobile: fixed bottom-right, no drag
  if (isMobile) {
    return (
      <div 
        className="fixed bottom-3 right-3 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1.5 shadow-lg select-none"
        style={{ zIndex: 9999 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-white">
          <User className="w-3.5 h-3.5" />
          <span className="font-medium">{userName}</span>
        </div>
      </div>
    );
  }

  // Desktop: minimized state
  if (isMinimized) {
    const style = position.x === 0 && position.y === 0 
      ? {} 
      : { 
          transform: `translate(${position.x}px, ${position.y}px)`,
          bottom: '1rem',
          right: '1rem'
        };

    return (
      <div 
        className={`fixed bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full p-2.5 shadow-sm cursor-pointer select-none hover:bg-white transition-colors ${position.x === 0 && position.y === 0 ? 'bottom-4 right-4' : ''}`}
        style={{ ...style, zIndex: 9999 }}
        onClick={handleExpand}
        title={`Profilo: ${userName} - Click per espandere`}
      >
        <User className="w-4 h-4 text-slate-700" />
      </div>
    );
  }

  // Desktop: expanded draggable with saved position
  const style = position.x === 0 && position.y === 0 
    ? {} 
    : { 
        transform: `translate(${position.x}px, ${position.y}px)`,
        bottom: '1rem',
        right: '1rem'
      };

  return (
    <div 
      className={`fixed bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm cursor-move select-none ${position.x === 0 && position.y === 0 ? 'bottom-4 right-4' : ''}`}
      style={{ ...style, zIndex: 9999 }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <User className="w-4 h-4" />
        <span className="font-medium">Profilo: {userName}</span>
        <Move className="w-3 h-3 opacity-50" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMinimize();
          }}
          className="ml-1 p-0.5 hover:bg-slate-200 rounded transition-colors"
          title="Minimizza"
        >
          <Minimize className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ProfileIndicator;