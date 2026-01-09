import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Clock, Sparkles, Loader2 } from 'lucide-react';
import { clearCachesAndReload, ContentUpdate } from '@/utils/contentUpdateManager';

interface ContentUpdateOverlayProps {
  isOpen: boolean;
  updates: ContentUpdate[];
  onDismiss: () => void;
}

const ContentUpdateOverlay: React.FC<ContentUpdateOverlayProps> = ({
  isOpen,
  updates,
  onDismiss
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      await clearCachesAndReload(updates);
      // La pagina farà reload, questo codice non verrà raggiunto
    } catch (error) {
      console.error('ContentUpdateOverlay: Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleLater = () => {
    // NON salvare le versioni - così l'overlay ricompare al prossimo avvio
    onDismiss();
  };

  if (!isOpen || updates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-blue-800">
            Nuovi contenuti disponibili
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-slate-600 text-center text-sm">
            Alcuni contenuti sono stati aggiornati, incluse le storie dell'Archivio Generale. Per vederli serve aggiornare l'app.
          </p>
          
          {/* Lista dataset aggiornati */}
          <div className="bg-white/80 rounded-lg p-4 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
              Contenuti aggiornati:
            </p>
            <ul className="space-y-1">
              {updates.map((update) => (
                <li 
                  key={update.key}
                  className="flex items-center gap-2 text-slate-700"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>{update.label}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Pulsanti azione */}
          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={handleUpdateNow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              size="lg"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Aggiornamento in corso...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  AGGIORNA ORA
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleLater}
              variant="ghost"
              className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              disabled={isUpdating}
            >
              <Clock className="w-4 h-4 mr-2" />
              PIÙ TARDI
            </Button>
          </div>
          
          <p className="text-xs text-slate-400 text-center">
            Se scegli "Più tardi", l'avviso ricomparirà al prossimo accesso
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentUpdateOverlay;
