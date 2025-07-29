import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import HomeButton from '@/components/HomeButton';

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
  return (
    <div className={`min-h-screen ${backgroundColor} p-4`}>
      {showHomeButton && <HomeButton />}
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800">{title}</h1>
              {subtitle && <p className="text-slate-600">{subtitle}</p>}
            </div>
          </div>
          {headerContent}
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default StoryLayout;