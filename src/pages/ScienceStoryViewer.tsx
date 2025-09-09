import React from 'react';
import { useParams } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { useNavigate } from 'react-router-dom';

const ScienceStoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Visualizza Storia di Scienza"
      subtitle={`Storia ID: ${id}`}
      onBack={() => navigate('/science-stories')}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Storia di Scienza</h2>
          <p className="text-gray-600">
            Contenuto della storia di scienza con ID: {id}
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p>Qui verrà visualizzato il contenuto della storia di scienza...</p>
          </div>
        </div>
      </div>
    </StoryLayout>
  );
};

export default ScienceStoryViewer;