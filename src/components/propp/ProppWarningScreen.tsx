import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Shuffle } from 'lucide-react';

interface ProppWarningScreenProps {
  onExit: () => void;
  onStart: () => void;
}

const ProppWarningScreen: React.FC<ProppWarningScreenProps> = ({ onExit, onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onExit}>
            <Home className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-800">Modalità PROPP</h1>
          <div></div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-red-600">⚠️ ATTENZIONE ⚠️</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg font-medium text-slate-700">
              Questa modalità richiede tempo e attenzione: la stesura sarà lunga e piena di colpi di scena.
            </p>
            <p className="text-base text-slate-600">
              Alla fine otterrai una vera favola pronta per essere pubblicata!
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={onExit} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Indietro
              </Button>
              <Button onClick={onStart} className="px-8">
                <Shuffle className="w-4 h-4 mr-2" />
                Inizia Favola Propp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProppWarningScreen;