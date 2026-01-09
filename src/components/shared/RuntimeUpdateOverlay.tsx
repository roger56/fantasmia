import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';

interface RuntimeUpdateOverlayProps {
  isUpdating: boolean;
  timeoutReached: boolean;
  onStartUpdate: () => void;
}

const RuntimeUpdateOverlay: React.FC<RuntimeUpdateOverlayProps> = ({
  isUpdating,
  timeoutReached,
  onStartUpdate
}) => {
  // Auto-start update when overlay appears
  useEffect(() => {
    if (!isUpdating) {
      onStartUpdate();
    }
  }, [isUpdating, onStartUpdate]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-blue-900/95 to-indigo-900/95 backdrop-blur-md">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-blue-300/30 bg-white/95">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              {isUpdating ? (
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              ) : (
                <RefreshCw className="w-10 h-10 text-blue-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-800 font-bold">
            Fantasmia si sta aggiornando
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-3">
            <p className="text-slate-700 text-lg">
              Aggiorniamo anche le storie dell'Archivio Generale...
            </p>
            <p className="text-slate-500">
              Attendi qualche secondo...
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          {/* Timeout message */}
          {timeoutReached && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <p className="text-amber-800 text-sm font-medium">
                Se l'aggiornamento non termina, chiudi e riapri Fantasmia
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RuntimeUpdateOverlay;
