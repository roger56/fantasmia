import React from 'react';
import StoryLayout from '@/components/shared/StoryLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const StoryTypeSelection = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Selezione Tipo Storia"
      subtitle="Scegli il tipo di storia da leggere"
      onBack={() => navigate('/dashboard')}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate('/reading-stories')}
            className="h-24 text-lg"
            variant="outline"
          >
            Storie di Lettura
          </Button>
          <Button
            onClick={() => navigate('/science-stories')}
            className="h-24 text-lg"
            variant="outline"
          >
            Storie di Scienza
          </Button>
          <Button
            onClick={() => navigate('/user-reading-superuser-stories')}
            className="h-24 text-lg"
            variant="outline"
          >
            Storie dei Miti Greci
          </Button>
          <Button
            onClick={() => navigate('/user-nordic-myths')}
            className="h-24 text-lg"
            variant="outline"
          >
            I Miti del Nord
          </Button>
          <Button
            onClick={() => navigate('/user-explorers')}
            className="h-24 text-lg"
            variant="outline"
          >
            I Grandi Esploratori
          </Button>
        </div>
      </div>
    </StoryLayout>
  );
};

export default StoryTypeSelection;