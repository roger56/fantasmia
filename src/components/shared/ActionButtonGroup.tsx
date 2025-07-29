import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Languages, Save, Share, Edit } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

interface ActionButtonGroupProps {
  content: string;
  language: 'italian' | 'english';
  onLanguageToggle?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  isTranslating?: boolean;
  showSave?: boolean;
  showEdit?: boolean;
  showShare?: boolean;
  showTranslate?: boolean;
  className?: string;
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  content,
  language,
  onLanguageToggle,
  onSave,
  onEdit,
  isTranslating = false,
  showSave = true,
  showEdit = false,
  showShare = true,
  showTranslate = true,
  className = ""
}) => {
  const { speak, getButtonText } = useTTS();

  const handleListen = () => {
    speak(content, language);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Button onClick={handleListen} variant="outline">
        <Volume2 className="w-4 h-4 mr-2" />
        {getButtonText()}
      </Button>
      
      {showTranslate && onLanguageToggle && (
        <Button 
          variant="outline" 
          onClick={onLanguageToggle}
          disabled={isTranslating}
        >
          <Languages className="w-4 h-4 mr-2" />
          {isTranslating ? 'Traduzione...' : (language === 'italian' ? 'ENGLISH' : 'ITALIANO')}
        </Button>
      )}
      
      {showEdit && onEdit && (
        <Button variant="outline" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          MODIFICA
        </Button>
      )}
      
      {showSave && onSave && (
        <Button variant="outline" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          SALVA
        </Button>
      )}
      
      {showShare && (
        <Button variant="outline" onClick={handleShare}>
          <Share className="w-4 h-4 mr-2" />
          CONDIVIDI
        </Button>
      )}
    </div>
  );
};

export default ActionButtonGroup;