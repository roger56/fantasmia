import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { useOTModeGuard } from '@/hooks/useOTModeGuard';

interface StoryLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showHomeButton?: boolean;
  headerContent?: React.ReactNode;
  backgroundColor?: string;
}

const StoryLayout: React.FC<StoryLayoutProps> = ({
  children,
  title,
  subtitle,
  onBack,
  showHomeButton = true,
  headerContent,
  backgroundColor = "bg-gradient-to-br from-slate-50 to-slate-100"
}) => {
  const navigate = useNavigate();
  const { safeNavigateHome } = useOTModeGuard();

  return (
    <div className={`min-h-screen ${backgroundColor} relative`}>
      {/* ProfileIndicator - sempre visibile e spostabile */}
      <ProfileIndicator />
      
      {/* ✅ REQUISITO 4: Barra superiore migliorata con spaziature coerenti */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 md:px-4 min-h-[3.5rem] md:min-h-[4rem] py-2 flex items-center justify-between">
          {/* Pulsante Indietro - in alto a sinistra */}
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="fixed top-3 md:top-4 left-3 md:left-4 bg-white shadow-md hover:shadow-lg z-50 h-8 w-8 md:h-10 md:w-10 p-0"
              size="icon"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          )}
          
          {/* Titolo centrale con margini adeguati per evitare sovrapposizione con bottoni */}
          <div className="flex-1 text-center px-12 md:px-16">
            <h1 className="text-base md:text-xl font-bold text-slate-800 truncate">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-slate-600 truncate">{subtitle}</p>}
          </div>
          
          {/* Pulsante Home - in alto a destra (usa safeNavigateHome per OT mode) */}
          {showHomeButton && (
            <Button 
              variant="ghost" 
              onClick={safeNavigateHome}
              className="fixed top-3 md:top-4 right-3 md:right-4 bg-white shadow-md hover:shadow-lg z-50 h-8 w-8 md:h-10 md:w-10 p-0"
              size="icon"
            >
              <Home className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          )}
        </div>
      </header>
      
      {/* Barra comandi separata - responsive e con safe-area */}
      {headerContent && (
        <div className="fixed top-14 md:top-16 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-100 px-3 py-2">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {headerContent}
            </div>
          </div>
        </div>
      )}
      
      {/* Contenuto principale con padding adeguato per header + barra comandi */}
      <main className={`${headerContent ? 'pt-28 md:pt-32' : 'pt-16 md:pt-20'} px-3 md:px-4 pb-4 safe-area-bottom`}>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default StoryLayout;