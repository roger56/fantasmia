import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ghost, Sparkles, Wand2, MessageCircle } from 'lucide-react';
import HomeButton from '@/components/HomeButton';
const CreateStory = () => {
  const navigate = useNavigate();
  const creationModes = [{
    id: 'GHOST',
    title: 'GHOST',
    subtitle: 'per creare favole FANTASMA goriche',
    icon: Ghost
  }, {
    id: 'PROPP',
    title: 'PROPP',
    icon: Sparkles
  }, {
    id: 'ALOVAF',
    title: 'ALOVAF',
    icon: Wand2
  }, {
    id: 'PAROLE_CHIAMANO',
    title: 'Parole Chiamano',
    icon: MessageCircle
  }];
  const handleModeSelect = (mode: string) => {
    if (mode === 'PROPP') {
      navigate('/propp-editor');
    } else if (mode === 'GHOST') {
      navigate('/ghost-editor');
    } else if (mode === 'PAROLE_CHIAMANO') {
      navigate('/parole-chiamano');
    } else if (mode === 'ALOVAF') {
      navigate('/alovaf-editor');
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button variant="ghost" onClick={() => navigate('/archive')} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Crea Nuova Favola</h1>
        </div>

        {/* Mode Selection */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-red-600 text-center">
                SCEGLI LA CATEGORIA CHE VUOI USARE PER LA TUA FAVOLA
              </h2>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {creationModes.map(mode => {
            const IconComponent = mode.icon;
            return <Card key={mode.id} className="cursor-pointer transition-all duration-200 border-2 hover:border-slate-300 hover:shadow-md" onClick={() => handleModeSelect(mode.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-8 h-8 text-slate-600" />
                      </div>
                    </div>
                    <CardTitle className="text-lg text-center">{mode.title}</CardTitle>
                    {mode.subtitle && <p className="text-sm text-center text-slate-600 mt-1">
                        {mode.subtitle}
                      </p>}
                  </CardHeader>
                </Card>;
          })}
          </div>
        </div>
      </div>
    </div>;
};
export default CreateStory;