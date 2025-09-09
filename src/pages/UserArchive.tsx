import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';

const UserArchive = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Archivio Magico (AM)"
      subtitle="Le tue storie personali"
      onBack={() => navigate('/dashboard')}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => (
            <Card key={id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-green-600" />
                  Storia Utente {id}
                </CardTitle>
                <CardDescription>
                  Archivio Magico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  La tua storia personale numero {id}...
                </p>
                <div className="space-y-2">
                  <Button 
                    size="sm"
                    className="w-full"
                  >
                    Visualizza
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Modifica
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </StoryLayout>
  );
};

export default UserArchive;