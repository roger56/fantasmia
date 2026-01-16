import React from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useOTModeGuard } from '@/hooks/useOTModeGuard';

const HomeButton = () => {
  const { safeNavigateHome } = useOTModeGuard();
  
  return (
    <Button 
      variant="ghost" 
      onClick={safeNavigateHome}
      className="fixed top-4 right-4 z-50 bg-white shadow-md hover:shadow-lg"
      size="icon"
    >
      <Home className="w-5 h-5" />
    </Button>
  );
};

export default HomeButton;
