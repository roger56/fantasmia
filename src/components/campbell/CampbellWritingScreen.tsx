import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CampbellCard } from '@/types/campbell';
import { useToast } from '@/hooks/use-toast';
import { validateBeforeContinue, validateBeforeSave, createToastMessage } from '@/utils/validation';
import StoryLayout from '@/components/shared/StoryLayout';
import StoryDisplayCard from '@/components/shared/StoryDisplayCard';
import WritingCard from '@/components/shared/WritingCard';
import ActionButtonGroup from '@/components/shared/ActionButtonGroup';
import SaveDialog from '@/components/SaveDialog';

interface CampbellWritingScreenProps {
  card: CampbellCard;
  currentContent: string;
  allContent: string;
  onContentChange: (content: string) => void;
  onBack: () => void;
  onSave: (title: string) => void;
  profileName?: string;
  language: 'italian' | 'english';
  onLanguageToggle: () => void;
}

const CampbellWritingScreen: React.FC<CampbellWritingScreenProps> = ({
  card,
  currentContent,
  allContent,
  onContentChange,
  onBack,
  onSave,
  profileName,
  language,
  onLanguageToggle
}) => {
  const [content, setContent] = useState(currentContent);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { toast } = useToast();

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  const handleContinue = () => {
    const validation = validateBeforeContinue(content);
    if (validation) {
      toast(validation);
      return;
    }
    onBack();
  };

  const handleSaveClick = () => {
    const validation = validateBeforeContinue(content);
    if (validation) {
      toast(validation);
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = (title: string) => {
    onSave(title);
    setShowSaveDialog(false);
  };

  const fullStoryContent = allContent + (content ? '\n' + content : '');

  if (showSaveDialog) {
    return (
      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveConfirm}
      />
    );
  }

  return (
    <StoryLayout
      title={`Carta #${card.id}: ${card.title}`}
      subtitle={card.description}
      onBack={onBack}
    >
      <StoryDisplayCard
        title="La tua storia finora:"
        content={allContent}
      />

      <WritingCard
        title="Continua la storia:"
        value={content}
        onChange={handleContentUpdate}
        placeholder="Scrivi qui il seguito della tua storia..."
      />

      <div className="flex flex-wrap gap-3 mt-6">
        <Button onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700">
          Continua
        </Button>
        
        <ActionButtonGroup
          content={fullStoryContent}
          language={language}
          onLanguageToggle={onLanguageToggle}
          onSave={handleSaveClick}
        />
      </div>
    </StoryLayout>
  );
};

export default CampbellWritingScreen;