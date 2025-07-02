
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const HomeButton = () => {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="ghost" 
      onClick={() => navigate('/')}
      className="fixed top-4 right-4 z-50 bg-white shadow-md hover:shadow-lg"
      size="icon"
    >
      <Home className="w-5 h-5" />
    </Button>
  );
};

export default HomeButton;
