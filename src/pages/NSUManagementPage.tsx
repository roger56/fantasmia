import React from 'react';
import { useNavigate } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import NSUManagement from '@/components/superuser/NSUManagement';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';

const NSUManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isChecking, isAuthorized } = useSuperuserGuard();

  // 🛡️ SECURITY: Spinner durante check autorizzazione
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
