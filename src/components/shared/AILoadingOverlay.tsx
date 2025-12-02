import React from 'react';
import { Loader2 } from 'lucide-react';

interface AILoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({ 
  isVisible, 
  message = "L'operazione con l'AI è in corso" 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4 border border-border">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">⏳ Attendere...</p>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default AILoadingOverlay;
