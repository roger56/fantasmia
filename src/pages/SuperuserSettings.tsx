import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Palette, Mail, Globe, CreditCard, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
      action: () => handleSettingClick('Scelta colori del sistema')
    },
    {
      title: 'Indirizzo email predefinito',
      description: 'Configura l\'email per invii automatici',
      icon: Mail,
      action: () => handleSettingClick('Indirizzo email predefinito')
    },
    {
      title: 'Lingua base del sistema',
      description: 'Imposta la lingua predefinita dell\'interfaccia',
      icon: Globe,
      action: () => handleSettingClick('Lingua base del sistema')
    },
    {
      title: 'Modalità di pagamento',
      description: 'Configura i metodi di pagamento disponibili',
      icon: CreditCard,
      action: () => handleSettingClick('Modalità di pagamento')
    },
    {
      title: 'SPARE (funzione futura)',
      description: 'Placeholder per funzionalità future',
      icon: Settings,
      action: () => handleSettingClick('SPARE')
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

        <div className="grid gap-4 md:grid-cols-2">
          {settingsOptions.map((option, index) => {
            const IconComponent = option.icon;
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
          })}
        </div>
      </div>
    </div>
  );
};

export default SuperuserSettings;