import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NewHome = () => {
  const navigate = useNavigate();

  const handleProfileSelect = (value: string) => {
    if (value === 'new-profile') {
      navigate('/terms-acceptance');
    } else {
      // Handle existing profile selection
      navigate('/profiles');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Navigation Header */}
      <nav className="w-full bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-center">
            <div className="flex space-x-8">
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => navigate('/')}
              >
                HOME
              </Button>
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => navigate('/about')}
              >
                COS'È FANTAS-Mia
              </Button>
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => navigate('/company')}
              >
                SOCIETÀ
              </Button>
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => navigate('/spare')}
              >
                SPARE
              </Button>
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => navigate('/privacy')}
              >
                PRIVACY
              </Button>
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => navigate('/contacts')}
              >
                CONTATTI
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Logo and illustration */}
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/6bc2720f-445b-440f-9afd-0b6b9485355c.png" 
              alt="FANTAS-Mia Logo" 
              className="max-w-md w-full h-auto"
            />
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">
                Benvenuto su FANTAS-Mia – Dove le tue storie prendono vita!
              </h1>
              <div className="space-y-4 text-slate-700">
                <p>
                  Vuoi inventare una favola tutta tua? Con FANTAS-Mia è facile e divertente!
                </p>
                <p>
                  Puoi creare la tua storia passo passo con domande magiche, parole speciali e immagini da sogno.
                </p>
                <p>
                  Parla, scrivi o ascolta la tua favola, guarda il disegno che la racconta o trasformala in una poesia in rima.
                </p>
                <p>
                  Ogni storia resta nel tuo scrigno personale, pronta per essere riletta, cambiata... o semplicemente sognata.
                </p>
              </div>
            </div>

            {/* Profile Selection */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Seleziona Profilo</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Profilo</label>
                  <Select onValueChange={handleProfileSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Scegli un profilo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-profile">Nuovo Profilo</SelectItem>
                      <SelectItem value="existing">Profilo Esistente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHome;