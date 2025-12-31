/**
 * Selettore lingua per "Conosci la parola"
 * Mostra bandiere IT/EN per selezionare la lingua del quiz
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConosciLaParolaLanguageSelectorProps {
  isOpen: boolean;
  onSelectLanguage: (language: 'it' | 'en') => void;
  onClose: () => void;
  activeLanguages: { it: boolean; en: boolean };
}

const ConosciLaParolaLanguageSelector: React.FC<ConosciLaParolaLanguageSelectorProps> = ({
  isOpen,
  onSelectLanguage,
  onClose,
  activeLanguages
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Scegli la lingua
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center gap-6 py-8">
          {activeLanguages.it && (
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-2 p-4 h-auto hover:bg-primary/10 transition-all"
              onClick={() => onSelectLanguage('it')}
            >
              <span className="text-6xl" role="img" aria-label="Italiano">🇮🇹</span>
              <span className="text-sm font-medium">Italiano</span>
            </Button>
          )}
          
          {activeLanguages.en && (
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-2 p-4 h-auto hover:bg-primary/10 transition-all"
              onClick={() => onSelectLanguage('en')}
            >
              <span className="text-6xl" role="img" aria-label="English">🇬🇧</span>
              <span className="text-sm font-medium">English</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConosciLaParolaLanguageSelector;
