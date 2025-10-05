import React, { useState, useEffect } from 'react';
import { User, Move } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';

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

  useEffect(() => {
    const checkUser = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (authStatus.authenticated && authStatus.userName) {
        setUserName(authStatus.userName);
      }
    };

    checkUser();

    // Responsive handler
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Desktop: draggable with saved position
  const style = position.x === 0 && position.y === 0 
    ? {} 
    : { 
        transform: `translate(${position.x}px, ${position.y}px)`,
        top: '1rem',
        right: '1rem'
      };

  return (
    <div 
      className={`fixed bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm z-50 cursor-move select-none ${position.x === 0 && position.y === 0 ? 'top-4 right-20' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <User className="w-4 h-4" />
        <span className="font-medium">Profilo: {userName}</span>
        <Move className="w-3 h-3 opacity-50" />
      </div>
    </div>
  );
};

export default ProfileIndicator;