/**
 * Icona animata per "Conosci la parola?"
 * Farfalla che rimbalza sui bordi dello schermo
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ConosciLaParolaIconProps {
  position: { x: number; y: number };
  onClick: () => void;
}

const ConosciLaParolaIcon: React.FC<ConosciLaParolaIconProps> = ({ position, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-[9999] cursor-pointer",
        "w-12 h-12 p-0 border-0 bg-transparent",
        "transition-transform duration-100 hover:scale-125",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      aria-label="Conosci la parola? Clicca per scoprire"
    >
      {/* Animated Butterfly SVG */}
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full drop-shadow-lg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}
      >
        {/* Left Wing */}
        <g className="origin-center" style={{ animation: 'wingFlap 0.3s ease-in-out infinite alternate' }}>
          <ellipse
            cx="20"
            cy="28"
            rx="16"
            ry="20"
            fill="url(#wingGradient1)"
            className="origin-right"
            style={{ 
              transformOrigin: '32px 32px',
              animation: 'leftWing 0.3s ease-in-out infinite alternate'
            }}
          />
          <ellipse
            cx="18"
            cy="26"
            rx="6"
            ry="8"
            fill="hsl(var(--primary) / 0.6)"
          />
          <ellipse
            cx="16"
            cy="34"
            rx="4"
            ry="5"
            fill="hsl(var(--accent) / 0.7)"
          />
        </g>
        
        {/* Right Wing */}
        <g className="origin-center">
          <ellipse
            cx="44"
            cy="28"
            rx="16"
            ry="20"
            fill="url(#wingGradient2)"
            style={{ 
              transformOrigin: '32px 32px',
              animation: 'rightWing 0.3s ease-in-out infinite alternate'
            }}
          />
          <ellipse
            cx="46"
            cy="26"
            rx="6"
            ry="8"
            fill="hsl(var(--primary) / 0.6)"
          />
          <ellipse
            cx="48"
            cy="34"
            rx="4"
            ry="5"
            fill="hsl(var(--accent) / 0.7)"
          />
        </g>
        
        {/* Body */}
        <ellipse cx="32" cy="32" rx="4" ry="14" fill="hsl(var(--foreground))" />
        
        {/* Head */}
        <circle cx="32" cy="16" r="5" fill="hsl(var(--foreground))" />
        
        {/* Antennae */}
        <path
          d="M30 12 Q28 6 24 4"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M34 12 Q36 6 40 4"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="24" cy="4" r="2" fill="hsl(var(--primary))" />
        <circle cx="40" cy="4" r="2" fill="hsl(var(--primary))" />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="wingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(280 70% 60%)" />
          </linearGradient>
          <linearGradient id="wingGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(280 70% 60%)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes leftWing {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(45deg); }
        }
        @keyframes rightWing {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-45deg); }
        }
      `}</style>
    </button>
  );
};

export default ConosciLaParolaIcon;
