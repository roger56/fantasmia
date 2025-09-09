import React from 'react';
import StoryLayout from '@/components/shared/StoryLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SuperuserScienceStoriesView = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Gestione Storie di Scienza"
      subtitle="Area Superuser - Visualizza e gestisci storie di scienza"
      onBack={() => navigate('/superuser-story-type-selection')}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Storie di Scienza</h2>
          <p className="text-gray-600 mb-4">
            Gestisci le storie di scienza nell'Archivio Generale (AG)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((id) => (
              <div key={id} className="border rounded-lg p-4">
                <h3 className="font-medium">Storia di Scienza {id}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Descrizione della storia di scienza...
                </p>
                <div className="mt-3 space-x-2">
                  <Button size="sm" variant="outline">
                    Modifica
                  </Button>
                  <Button size="sm" variant="outline">
                    Elimina
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StoryLayout>
  );
};

export default SuperuserScienceStoriesView;