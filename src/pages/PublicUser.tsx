
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import HomeButton from '@/components/HomeButton';

const PublicUser = () => {
  const navigate = useNavigate();

  const publicOptions = [
    {
      title: 'Leggi Storie Pubbliche',
      description: 'Scopri le storie condivise dalla community',
      icon: BookOpen,
      action: () => navigate('/archive', { state: { profileId: 'public', profileName: 'Utente Pubblico', isPublic: true } })
    },
    {
      title: 'Crea Storia',
      description: 'Crea una nuova storia (sarà visibile a tutti)',
      icon: Plus,
      action: () => navigate('/create-story', { state: { isPublic: true } })
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
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
                Crea e leggi storie liberamente. Le tue creazioni saranno visibili a tutti
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
        </div>
      </div>
    </div>
  );
};

export default PublicUser;
