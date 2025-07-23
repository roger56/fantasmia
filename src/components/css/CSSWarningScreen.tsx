import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import HomeButton from '@/components/HomeButton';

interface CSSWarningScreenProps {
  onContinue: () => void;
  onExit: () => void;
}

const CSSWarningScreen: React.FC<CSSWarningScreenProps> = ({ onContinue, onExit }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <HomeButton />
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-slate-800">
              Cosa succede se...?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-slate-600 text-lg mb-4">
                Benvenuto nella modalità "Cosa succede se...?"!
              </p>
              <p className="text-slate-700 mb-6">
                Partirai da una domanda fantastica e costruirai una storia seguendo 
                le domande guida. Usa la tua immaginazione per creare una storia unica 
                e divertente!
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Come funziona:</h3>
              <ul className="space-y-2 text-sm text-purple-700">
                <li>• Scegli o scrivi una domanda "Cosa succede se...?"</li>
                <li>• Rispondi alle domande guida per costruire la storia</li>
                <li>• Puoi scrivere o usare la voce</li>
                <li>• Alla fine potrai salvare e condividere la tua storia</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={onExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna indietro
              </Button>
              <Button onClick={onContinue} className="bg-purple-600 hover:bg-purple-700">
                Inizia l'avventura!
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSSWarningScreen;