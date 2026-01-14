import React from 'react';
import { useNavigate } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import NSUManagement from '@/components/superuser/NSUManagement';

const NSUManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Gestione NSU"
      subtitle="Crea e gestisci profili utente con password dedicate"
      onBack={() => navigate('/superuser')}
    >
      <NSUManagement />
    </StoryLayout>
  );
};

export default NSUManagementPage;
