
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Play } from 'lucide-react';

const PublicUser = () => {
  const navigate = useNavigate();

  const publicOptions = [
    {
      title: 'Leggi Favole Pubbliche',
      description: 'Scopri le favole condivise dalla community',
      icon: BookOpen,
      action: () => navigate('/public/stories')
    },
    {
      title: 'Modalità Demo',
      description: 'Prova a creare una favola senza registrarti',
      icon: Play,
      action: () => navigate('/demo/create')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Utente Pubblico</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Benvenuto in Fantasmia
              </h2>
              <p className="text-slate-600">
                Esplora il mondo delle favole anche senza creare un profilo
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {publicOptions.map((option, index) => {
              const IconComponent = option.icon;
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
            })}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Vuoi di più?
              </h3>
              <p className="text-blue-800 mb-4">
                Crea un profilo per salvare le tue favole e accedere a tutte le funzionalità
              </p>
              <Button 
                onClick={() => navigate('/new-profile')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crea Profilo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicUser;
