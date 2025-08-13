import React, { useState, useEffect } from 'react';
import { User, Move } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';

const ProfileIndicator: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: position.x,
      elementY: position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPosition({
        x: dragStart.elementX + deltaX,
        y: dragStart.elementY + deltaY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  const style = position.x === 0 && position.y === 0 
    ? {} 
    : { 
        transform: `translate(${position.x}px, ${position.y}px)`,
        top: '1rem',
        right: '1rem'
      };

  return (
    <div 
      className={`fixed bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm z-50 cursor-move select-none ${position.x === 0 && position.y === 0 ? 'top-4 right-4' : ''}`}
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