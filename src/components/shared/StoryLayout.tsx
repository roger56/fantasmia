import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

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

  return (
    <div className={`min-h-screen ${backgroundColor} relative`}>
      {/* ProfileIndicator - sempre visibile e spostabile */}
      <ProfileIndicator />
      
      {/* Barra superiore V2 - tutte le azioni in alto */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Pulsante Indietro - in alto a sinistra */}
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="fixed top-4 left-4 bg-white shadow-md hover:shadow-lg z-50"
              size="icon"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {/* Titolo centrale */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
          
          {/* Contenuto header aggiuntivo */}
          {headerContent && (
            <div className="flex items-center gap-2">
              {headerContent}
            </div>
          )}
          
          {/* Pulsante Home - in alto a destra */}
          {showHomeButton && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/profiles')}
              className="fixed top-4 right-4 bg-white shadow-md hover:shadow-lg z-50"
              size="icon"
            >
              <Home className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>
      
      {/* Contenuto principale */}
      <main className="pt-20 px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default StoryLayout;