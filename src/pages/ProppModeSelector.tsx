import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProppModeSelector from '@/components/propp/ProppModeSelector';

const ProppModeSelectorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId, profileName } = location.state || {};

  const handleExit = () => {
    navigate('/create-story', { state: { profileId, profileName } });
  };

  return (
    <ProppModeSelector 
      profileId={profileId}
      profileName={profileName}
      onExit={handleExit}
    />
  );
};

export default ProppModeSelectorPage;