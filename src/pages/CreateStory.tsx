
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ghost, Sparkles } from 'lucide-react';

const CreateStory = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const creationModes = [
    {
      id: 'GHOST',
      title: 'Modalità GHOST',
      description: 'Creazione libera e spontanea della favola',
      icon: Ghost,
      features: ['Scrittura libera', 'Senza vincoli strutturali', 'Creatività totale']
    },
    {
      id: 'PROPP',
      title: 'Modalità PROPP',
      description: 'Creazione guidata con struttura narrativa',
      icon: Sparkles,
      features: ['Cluster narrativi', 'Carte tematiche', 'Struttura guidata', 'Icone per cluster']
    }
  ];

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
  };

  const handleStartCreation = () => {
    if (selectedMode === 'PROPP') {
      navigate('/propp-editor');
    } else if (selectedMode === 'GHOST') {
      navigate('/ghost-editor');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/archive')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Crea Nuova Favola</h1>
        </div>

        {/* Mode Selection */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Scegli la Modalità di Creazione
              </h2>
              <p className="text-slate-600">
                Seleziona come vuoi creare la tua favola
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {creationModes.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = selectedMode === mode.id;
              
              return (
                <Card 
                  key={mode.id}
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'border-blue-300 bg-blue-50 shadow-md' 
                      : 'hover:border-slate-300 hover:shadow-md'
                  }`}
                  onClick={() => handleModeSelect(mode.id)}
                >
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        isSelected ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          isSelected ? 'text-blue-600' : 'text-slate-600'
                        }`} />
                      </div>
                      <CardTitle className="text-lg">{mode.title}</CardTitle>
                    </div>
                    <p className="text-slate-600 text-sm">{mode.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {mode.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-700">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Button 
              onClick={() => navigate('/archive')}
              variant="outline"
              className="px-8"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleStartCreation}
              disabled={!selectedMode}
              className="px-8"
            >
              Inizia Creazione
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStory;
