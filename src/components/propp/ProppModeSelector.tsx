import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Shuffle } from 'lucide-react';
import HomeButton from '@/components/HomeButton';

interface ProppModeSelectorProps {
  profileId?: string;
  profileName?: string;
  onExit: () => void;
}

const ProppModeSelector: React.FC<ProppModeSelectorProps> = ({ profileId, profileName, onExit }) => {
  const navigate = useNavigate();

  const handleModeSelect = (mode: 'serial' | 'free') => {
    if (mode === 'serial') {
      navigate('/propp-editor', { 
        state: { 
          profileId, 
          profileName, 
          mode: 'serial' 
        } 
      });
    } else {
      navigate('/propp-editor', { 
        state: { 
          profileId, 
          profileName, 
          mode: 'free' 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button variant="ghost" onClick={onExit} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Modalità Propp</h1>
        </div>

        {/* Mode Selection */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-red-600 text-center">
                SCEGLI LA MODALITÀ CHE VUOI USARE
              </h2>
              <p className="text-sm text-slate-600 text-center">
                Entrambe le modalità seguono le funzioni narrative di Vladimir Propp
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Serial Mode */}
            <Card 
              className="cursor-pointer transition-all duration-200 border-2 hover:border-slate-300 hover:shadow-md h-40" 
              onClick={() => handleModeSelect('serial')}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg text-center text-blue-700">Propp - Modalità Seriale</CardTitle>
                <p className="text-sm text-center text-slate-600 mt-2 leading-tight">
                  Percorso guidato secondo la sequenza di cluster. Segui l'ordine tradizionale delle funzioni narrative.
                </p>
              </CardHeader>
            </Card>

            {/* Free Mode */}
            <Card 
              className="cursor-pointer transition-all duration-200 border-2 hover:border-slate-300 hover:shadow-md h-40" 
              onClick={() => handleModeSelect('free')}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shuffle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-lg text-center text-green-700">Propp - Carte Libere</CardTitle>
                <p className="text-sm text-center text-slate-600 mt-2 leading-tight">
                  Scegli liberamente le carte da usare. Crea il tuo percorso narrativo in autonomia.
                </p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProppModeSelector;