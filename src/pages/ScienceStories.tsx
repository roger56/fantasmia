import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';

const ScienceStories = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Storie di Scienza"
      subtitle="Archivio Generale (AG) - Storie Scientifiche"
      onBack={() => navigate('/dashboard')}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => (
            <Card key={id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  Storia di Scienza {id}
                </CardTitle>
                <CardDescription>
                  Categoria: Scientifica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Descrizione della storia scientifica numero {id}...
                </p>
                <Button 
                  onClick={() => navigate(`/science-story-viewer/${id}`)}
                  size="sm"
                  className="w-full"
                >
                  Leggi Storia
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </StoryLayout>
  );
};

export default ScienceStories;