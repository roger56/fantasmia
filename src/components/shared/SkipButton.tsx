import React from 'react';
import { Button } from '@/components/ui/button';
import { SkipForward } from 'lucide-react';

interface SkipButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
}

const SkipButton: React.FC<SkipButtonProps> = ({ 
  onClick, 
  children = "SALTA", 
  className = "" 
}) => {
  return (
    <Button 
      onClick={onClick}
      variant="outline"
      className={`fixed bottom-4 left-4 z-40 bg-white shadow-md hover:shadow-lg ${className}`}
    >
      <SkipForward className="w-4 h-4 mr-2" />
      {children}
    </Button>
  );
};

export default SkipButton;