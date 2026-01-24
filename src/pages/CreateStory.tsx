import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ghost, Sparkles, Wand2, MessageCircle, Briefcase, Star, Lightbulb } from 'lucide-react';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import HomeButton from '@/components/HomeButton';
import StoryModeTooltip from '@/components/shared/StoryModeTooltip';
import { AuthBridge } from '@/utils/authBridge';

// Tooltip texts loaded from JSON for easy translation
import tooltipsData from '../../public/story-mode-tooltips.json';

const CreateStory = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string>('');
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      setIsAuthenticated(true);
      setProfileId(authStatus.userId);
      setProfileName(authStatus.userName);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const creationModes = [{
    id: 'PROFESSION',
    title: 'Cosa farei se fossi un...',
    subtitle: 'Ogni mestiere nasconde una sorpresa, scoprila con la fantasia',
    icon: Briefcase,
    difficulty: 1
  }, {
    id: 'CSS',
    title: 'COSA SUCCEDE SE...?',
    subtitle: 'Parti da una domanda fantastica e costruisci la storia.',
    icon: Sparkles,
    difficulty: 2
  }, {
    id: 'GHOST',
    title: 'GHOST',
    subtitle: 'Per creare storie FANTASMAgoriche!',
    icon: Ghost,
    difficulty: 3
  }, {
    id: 'PAROLE_CHIAMANO',
    title: 'Una Parola, Tante Storie',
    subtitle: 'Una parola ne suggerisce altre per costruire il racconto.',
    icon: MessageCircle,
    difficulty: 4
  }, {
    id: 'AIROTS',
    title: 'AIROTS',
    subtitle: 'La storia… al contrario!',
    icon: Wand2,
    difficulty: 4
  }, {
    id: 'CAMPBELL',
    title: 'CARTE DI CAMPBELL',
    subtitle: 'Il Viaggio dell\'Eroe in 12 tappe narrative.',
    icon: Sparkles,
    difficulty: 5
  }, {
    id: 'PROPP',
    title: 'PROPP',
    subtitle: 'L\'eroe affronta difficoltà e vince.',
    icon: Sparkles,
    difficulty: 5
  }, {
    id: 'STRANGE_FACT',
    title: 'Crea la storia di un fatto strano che ti è capitato',
    subtitle: 'Trasforma un evento reale in racconto fantastico',
    icon: Lightbulb,
    difficulty: 1
  }];

  const handleModeSelect = (mode: string) => {
    const state = { profileId, profileName };
    
    if (mode === 'PROPP') {
      navigate('/propp-mode-selector', { state });
    } else if (mode === 'GHOST') {
      navigate('/ghost-editor', { state });
    } else if (mode === 'PAROLE_CHIAMANO') {
      navigate('/parole-chiamano', { state });
    } else if (mode === 'AIROTS') {
      navigate('/airots-editor', { state });
    } else if (mode === 'CAMPBELL') {
      navigate('/campbell-editor', { state });
    } else if (mode === 'CSS') {
      navigate('/css-editor', { state });
    } else if (mode === 'PROFESSION') {
      navigate('/profession-story', { state });
    } else if (mode === 'STRANGE_FACT') {
      navigate('/strange-fact-editor', { state });
    }
  };

  const getTooltipText = (modeId: string): string => {
    const tooltip = tooltipsData[modeId as keyof typeof tooltipsData];
    return tooltip?.text || '';
  };

  return (
    <>
      <ProfileIndicator />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
      
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Crea Nuova Storia</h1>
          </div>

          {/* Mode Selection */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2 text-red-600 text-center">
                  SCEGLI LA CATEGORIA CHE VUOI USARE PER LA TUA STORIA
                </h2>
                <p className="text-base text-slate-600 text-center mt-3">
                  Nei box di scelta, ogni stella rossa in più aumenta l'impegno nel creare una storia.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creationModes.map(mode => {
                const IconComponent = mode.icon;
                const tooltipText = getTooltipText(mode.id);
                
                return (
                  <Card 
                    key={mode.id} 
                    className={`cursor-pointer transition-all duration-200 border-2 hover:border-slate-300 hover:shadow-md h-32 relative ${mode.id === 'STRANGE_FACT' ? 'border-blue-400 bg-blue-50 hover:border-blue-500' : ''}`} 
                    onClick={() => handleModeSelect(mode.id)}
                  >
                    {/* Info Tooltip */}
                    {tooltipText && (
                      <StoryModeTooltip text={tooltipText} modeId={mode.id} />
                    )}
                    
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-center mb-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode.id === 'STRANGE_FACT' ? 'bg-blue-200' : 'bg-slate-100'}`}>
                          <IconComponent className={`w-4 h-4 ${mode.id === 'STRANGE_FACT' ? 'text-blue-700' : 'text-slate-600'}`} />
                        </div>
                      </div>
                      <CardTitle className="text-sm text-center">{mode.title}</CardTitle>
                      {mode.subtitle && (
                        <p className="text-xs text-center text-slate-600 mt-1 leading-tight">
                          {mode.subtitle}
                        </p>
                      )}
                    </CardHeader>
                    
                    {/* Difficulty Stars */}
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= mode.difficulty 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateStory;
