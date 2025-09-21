import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Settings } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';

const SuperUser = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Dashboard Superuser"
      subtitle="Pannello di controllo amministratore"
      onBack={() => navigate('/profiles')}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Gestione Storie
              </CardTitle>
              <CardDescription>
                Visualizza e gestisci tutte le storie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/superuser-story-type-selection')}
                className="w-full"
              >
                Vai alla Gestione
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Archivio Utenti (AM)
              </CardTitle>
              <CardDescription>
                Visualizza e gestisci storie degli utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/superuser-am-archive')}
                className="w-full"
                variant="outline"
              >
                Visualizza Archivio AM
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Gestione Utenti
              </CardTitle>
              <CardDescription>
                Visualizza e gestisci utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/superuser-users')}
                className="w-full"
                variant="outline"
              >
                Gestione Utenti
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Impostazioni
              </CardTitle>
              <CardDescription>
                Configurazioni di sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full"
                disabled
              >
                Configurazioni
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoryLayout>
  );
};

export default SuperUser;