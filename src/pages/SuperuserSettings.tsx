import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Palette, Mail, Globe, CreditCard, Settings, Shield, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import AlbumSettings, { AlbumSettingsData } from '@/components/superuser/AlbumSettings';
import { fantasMiaDB } from '@/utils/indexedDB';

const SuperuserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [albumSettings, setAlbumSettings] = useState<AlbumSettingsData>(() => {
    const saved = localStorage.getItem('fantasmia_album_settings');
    return saved ? JSON.parse(saved) : {
      minStoriesForAlbum: 5,
      pageSize: 'A4-portrait',
      margins: 20,
      fontFamily: 'Arial',
      fontSizeBody: 12,
      fontSizeTitles: 18,
      imageStyleDefault: 'fotografico'
    };
  });

  const [emailSettings, setEmailSettings] = useState({
    minStoriesForEmail: 1,
    maxStoriesForEmail: 2
  });

  const [isLoadingEmailSettings, setIsLoadingEmailSettings] = useState(true);

  useEffect(() => {
    localStorage.setItem('fantasmia_album_settings', JSON.stringify(albumSettings));
  }, [albumSettings]);

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const settings = await fantasMiaDB.getSystemSettings();
      setEmailSettings({
        minStoriesForEmail: settings.minStoriesForEmail,
        maxStoriesForEmail: settings.maxStoriesForEmail
      });
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le impostazioni email",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEmailSettings(false);
    }
  };

  const handleEmailSettingsChange = async (field: 'minStoriesForEmail' | 'maxStoriesForEmail', value: number) => {
    const newSettings = { ...emailSettings, [field]: value };
    
    // Validation: min must be <= max
    if (field === 'minStoriesForEmail' && value > newSettings.maxStoriesForEmail) {
      toast({
        title: "Errore di validazione",
        description: "Il minimo non può essere maggiore del massimo",
        variant: "destructive"
      });
      return;
    }
    
    if (field === 'maxStoriesForEmail' && value < newSettings.minStoriesForEmail) {
      toast({
        title: "Errore di validazione",
        description: "Il massimo non può essere minore del minimo",
        variant: "destructive"
      });
      return;
    }

    setEmailSettings(newSettings);
    
    try {
      await fantasMiaDB.saveSystemSettings(newSettings);
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni email sono state aggiornate"
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
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
      title: 'SPARE (funzione futura)',
      description: 'Placeholder per funzionalità future',
      icon: Settings,
      action: () => handleSettingClick('SPARE'),
      showTooltip: true
    },
    {
      title: 'Album e Impaginazione',
      description: 'Impostazioni per creazione album stampabili',
      icon: BookOpen,
      action: () => {}, // Handled inline
      showTooltip: false,
      isInline: true
    },
    {
      title: 'Configurazione invio album via e-mail',
      description: 'Limiti min/max per selezione storie da inviare',
      icon: Mail,
      action: () => {}, // Handled inline
      showTooltip: false,
      isInline: true,
      isEmailConfig: true
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
            
            // Special inline component for Album settings
            if (option.isInline && !option.isEmailConfig) {
              return (
                <div key={index} className="md:col-span-2">
                  <AlbumSettings settings={albumSettings} onChange={setAlbumSettings} />
                </div>
              );
            }

            // Special inline component for Email configuration
            if (option.isEmailConfig) {
              return (
                <div key={index} className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          <Mail className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                          <CardTitle>Configurazione invio album via e-mail</CardTitle>
                          <p className="text-sm text-slate-600 mt-1">
                            Definisci il numero minimo e massimo di storie selezionabili per l'invio
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingEmailSettings ? (
                        <p className="text-sm text-muted-foreground">Caricamento...</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minStories">Numero minimo di storie</Label>
                            <Input
                              id="minStories"
                              type="number"
                              min="1"
                              value={emailSettings.minStoriesForEmail}
                              onChange={(e) => handleEmailSettingsChange('minStoriesForEmail', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxStories">Numero massimo di storie</Label>
                            <Input
                              id="maxStories"
                              type="number"
                              min="1"
                              value={emailSettings.maxStoriesForEmail}
                              onChange={(e) => handleEmailSettingsChange('maxStoriesForEmail', parseInt(e.target.value) || 2)}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            }
            
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