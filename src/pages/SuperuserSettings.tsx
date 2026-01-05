import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Palette, Mail, Globe, CreditCard, Settings, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { fantasMiaDB } from '@/utils/indexedDB';

const DEFAULT_ALBUM_EMAIL = 'quando.ruggero@gmail.com';
const EMAIL_GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

const SuperuserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Email settings state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [albumEmail, setAlbumEmail] = useState(DEFAULT_ALBUM_EMAIL);
  const [emailError, setEmailError] = useState('');

  // Load email settings on mount
  useEffect(() => {
    loadEmailSettings();
  }, []);
  
  const loadEmailSettings = async () => {
    try {
      await fantasMiaDB.init();
      const settings = await fantasMiaDB.getSystemSettings();
      if (settings.album_default_email) {
        setAlbumEmail(settings.album_default_email);
      }
    } catch (e) {
      console.warn('Error loading email settings', e);
    }
  };

  const handleSettingClick = (settingName: string) => {
    toast({
      title: "IN VIA DI SVILUPPO",
      description: `${settingName} sarà presto disponibile`,
      variant: "default"
    });
  };
  
  const handleOpenEmailDialog = () => {
    setEmailError('');
    setShowEmailDialog(true);
  };
  
  const handleSaveEmail = async () => {
    // Validate email
    if (!EMAIL_GMAIL_REGEX.test(albumEmail)) {
      setEmailError('Inserisci un indirizzo email valido @gmail.com');
      return;
    }
    
    try {
      await fantasMiaDB.init();
      const currentSettings = await fantasMiaDB.getSystemSettings();
      await fantasMiaDB.saveSystemSettings({
        ...currentSettings,
        album_default_email: albumEmail
      });
      
      setShowEmailDialog(false);
      toast({
        title: "Email salvata",
        description: `L'email predefinita è stata impostata su ${albumEmail}`,
      });
    } catch (e) {
      toast({
        title: "Errore",
        description: "Impossibile salvare l'email",
        variant: "destructive"
      });
    }
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
      action: handleOpenEmailDialog,
      showTooltip: false
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
      description: 'Configura timing, velocità e gestisci parole',
      icon: Sparkles,
      action: () => navigate('/superuser-butterfly-settings'),
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
        
        {/* Email Configuration Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Indirizzo Email Predefinito</DialogTitle>
              <DialogDescription>
                Questa email viene usata come destinatario predefinito per l'invio Album.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="albumEmail">Email (solo @gmail.com)</Label>
                <Input
                  id="albumEmail"
                  type="email"
                  value={albumEmail}
                  onChange={(e) => {
                    setAlbumEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="esempio@gmail.com"
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Annulla
              </Button>
              <Button onClick={handleSaveEmail}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperuserSettings;
