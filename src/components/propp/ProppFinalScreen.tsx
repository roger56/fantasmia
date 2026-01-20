import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Globe, Home, Save } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import ModifyMenu from "@/components/shared/ModifyMenu";

interface ProppFinalScreenProps {
  storyTitle: string;
  finalStory: string;
  onTitleChange: (title: string) => void;
  onStoryChange: (story: string) => void;
  onSave: () => void;
  profileId?: string;
  profileName?: string;
}

const ProppFinalScreen: React.FC<ProppFinalScreenProps> = ({
  storyTitle,
  finalStory,
  onTitleChange,
  onStoryChange,
  onSave,
  profileId,
  profileName
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editMode, setEditMode] = React.useState(false);
  const { isTranslated, isTranslating, translateContent, getButtonText } = useTranslation();

  const handleTranslateClick = () => {
    translateContent(finalStory, storyTitle, onStoryChange, onTitleChange);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(finalStory);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
            <Home className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-800">La Tua Storia Propp</h1>
          <div></div>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>🎉 La tua storia è pronta!</CardTitle>
            <p className="text-slate-600">Inserisci un titolo e salva la tua creazione</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titolo della Storia *
              </label>
              <Textarea
                placeholder="Inserisci il titolo della tua storia..."
                value={storyTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-lg resize-none overflow-hidden min-h-[80px]"
                style={{ height: 'auto', minHeight: '80px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                La tua storia completa
              </label>
              <Textarea
                value={finalStory}
                onChange={(e) => onStoryChange(e.target.value)}
                className="text-base leading-relaxed resize-none overflow-hidden min-h-[80px]"
                style={{ height: 'auto', minHeight: '80px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, window.innerHeight * 0.6) + 'px';
                }}
              />
            </div>

            {/* Modify Menu with Text Improvement */}
            <ModifyMenu
              storyContent={finalStory}
              isEditing={editMode}
              onEditToggle={() => setEditMode(!editMode)}
              onContentChange={onStoryChange}
              storyTitle={storyTitle}
              className="mb-6"
            />

            <div className="flex flex-wrap gap-2 justify-center safe-area-bottom">
              <Button onClick={onSave} size="sm" className="text-xs sm:text-sm px-3 sm:px-6" disabled={!storyTitle.trim()}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Salva
              </Button>
              <Button 
                onClick={handleTranslateClick} 
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm px-3 sm:px-6" 
                disabled={isTranslating || !finalStory.trim()}
              >
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{getButtonText()}</span>
                <span className="sm:hidden">🌐</span>
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm px-3 sm:px-6"
                disabled={!finalStory.trim()}
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Copia</span>
                <span className="sm:hidden">📋</span>
              </Button>
              <Button 
                onClick={() => navigate('/create-story', { state: { profileId, profileName } })} 
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm px-3 sm:px-6"
              >
                <span className="hidden sm:inline">Nuova Storia</span>
                <span className="sm:hidden">➕ Nuova</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProppFinalScreen;