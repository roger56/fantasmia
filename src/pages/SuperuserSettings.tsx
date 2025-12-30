import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Palette, Mail, Globe, CreditCard, Settings, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const WORDGAME_SETTINGS_KEY = 'fantasmia_wordgame_settings';

interface WordGameSettings {
  startDelay: number; // in seconds
  animationDuration: number; // in seconds
}

const SuperuserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Word game settings state
  const [wordGameSettings, setWordGameSettings] = useState<WordGameSettings>({
    startDelay: 120, // 2 minutes default
    animationDuration: 20 // 20 seconds default
  });
  const [showWordGameSettings, setShowWordGameSettings] = useState(false);

  // Load word game settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORDGAME_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setWordGameSettings({
          startDelay: parsed.startDelay || 120,
          animationDuration: parsed.animationDuration || 20
        });
      }
    } catch (e) {
      console.warn('Error loading word game settings', e);
    }
  }, []);

  const handleSaveWordGameSettings = () => {
    try {
      localStorage.setItem(WORDGAME_SETTINGS_KEY, JSON.stringify(wordGameSettings));
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni della farfalla sono state aggiornate",
      });
      setShowWordGameSettings(false);
    } catch (e) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive"
      });
    }
  };

  const handleSettingClick = (settingName: string) => {
    toast({
      title: "IN VIA DI SVILUPPO",
      description: `${settingName} sarà presto disponibile`,
      variant: "default"
    });
  };

  const settingsOptions = [
    {
      title: 'Scelta colori del sistema',
      description: 'Personalizza la palette colori dell\'applicazione',
      icon: Palette,
      action: () => handleSettingClick('Scelta colori del sistema'),
      showTooltip: true
    },
    {
      title: 'Indirizzo email predefinito',
      description: 'Configura l\'email per invii automatici',
      icon: Mail,
      action: () => handleSettingClick('Indirizzo email predefinito'),
      showTooltip: true
    },
    {
      title: 'Lingua base del sistema',
      description: 'Imposta la lingua predefinita dell\'interfaccia',
      icon: Globe,
      action: () => handleSettingClick('Lingua base del sistema'),
      showTooltip: true
    },
    {
      title: 'Modalità di pagamento',
      description: 'Configura i metodi di pagamento disponibili',
      icon: CreditCard,
      action: () => navigate('/superuser-payment-settings'),
      showTooltip: false
    },
    {
      title: 'Sicurezza',
      description: 'Modifica password e impostazioni di sicurezza',
      icon: Shield,
      action: () => navigate('/superuser-password-change'),
      showTooltip: false
    },
    {
      title: 'Conosci la Parola (Farfalla)',
      description: 'Configura timing e durata dell\'animazione',
      icon: Sparkles,
      action: () => setShowWordGameSettings(true),
      showTooltip: false
    },
    {
      title: 'SPARE (funzione futura)',
      description: 'Placeholder per funzionalità future',
      icon: Settings,
      action: () => handleSettingClick('SPARE'),
      showTooltip: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Impostazioni Sistema</h1>
              <p className="text-slate-600">Configurazioni avanzate di Fantasmia</p>
            </div>
          </div>
        </div>

        {/* Word Game Settings Panel */}
        {showWordGameSettings && (
          <Card className="mb-6 border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Impostazioni Farfalla "Conosci la Parola"
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDelay">Ritardo apparizione (secondi)</Label>
                  <Input
                    id="startDelay"
                    type="number"
                    min={5}
                    max={600}
                    value={wordGameSettings.startDelay}
                    onChange={(e) => setWordGameSettings(prev => ({
                      ...prev,
                      startDelay: parseInt(e.target.value) || 120
                    }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tempo di attesa prima che appaia la farfalla (5-600s)</p>
                </div>
                
                <div>
                  <Label htmlFor="animationDuration">Durata animazione (secondi)</Label>
                  <Input
                    id="animationDuration"
                    type="number"
                    min={5}
                    max={120}
                    value={wordGameSettings.animationDuration}
                    onChange={(e) => setWordGameSettings(prev => ({
                      ...prev,
                      animationDuration: parseInt(e.target.value) || 20
                    }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Per quanto tempo la farfalla rimane visibile (5-120s)</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveWordGameSettings}>
                  Salva impostazioni
                </Button>
                <Button variant="outline" onClick={() => setShowWordGameSettings(false)}>
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {settingsOptions.map((option, index) => {
            const IconComponent = option.icon;
            
            if (option.showTooltip) {
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                        onClick={option.action}
                      >
                        <CardContent className="p-6 flex items-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                            <IconComponent className="w-6 h-6 text-slate-700" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800">{option.title}</h3>
                            <p className="text-slate-600 text-sm">{option.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>IN VIA DI SVILUPPO</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            } else {
              return (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                  onClick={option.action}
                >
                  <CardContent className="p-6 flex items-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                      <IconComponent className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">{option.title}</h3>
                      <p className="text-slate-600 text-sm">{option.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default SuperuserSettings;
