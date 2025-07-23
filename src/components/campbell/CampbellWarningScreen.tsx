import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CampbellWarningScreenProps {
  onContinue: () => void;
  onExit: () => void;
}

const CampbellWarningScreen: React.FC<CampbellWarningScreenProps> = ({
  onContinue,
  onExit
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Carte di Campbell
            </CardTitle>
            <p className="text-lg text-slate-600 mt-2">
              Il Viaggio dell'Eroe
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-slate-700 leading-relaxed">
                Benvenuto nel <strong>Viaggio dell'Eroe</strong>! 
              </p>
              <p className="text-slate-700 leading-relaxed mt-4">
                Seguendo le 12 tappe del famoso schema di Joseph Campbell, 
                potrai creare una storia personale dove il protagonista affronta 
                sfide, incontra alleati e nemici, e torna trasformato dalla sua avventura.
              </p>
              <p className="text-slate-700 leading-relaxed mt-4">
                Ogni carta rappresenta una tappa importante del viaggio. 
                Puoi seguire l'ordine suggerito o saltare alcune carte, 
                ma ricorda: ogni grande eroe ha una storia da raccontare!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={onExit}
                className="w-full sm:w-auto"
              >
                Torna indietro
              </Button>
              <Button 
                onClick={onContinue}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                Inizia il viaggio
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampbellWarningScreen;