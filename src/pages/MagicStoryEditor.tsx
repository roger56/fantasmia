import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import { getCurrentProfileId } from '@/utils/profileManager';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import ActionButtonGroup from '@/components/shared/ActionButtonGroup';
import ModifyMenu from '@/components/shared/ModifyMenu';

const MagicStoryEditor = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Errore", 
        description: "Il contenuto della storia è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const profileId = getCurrentProfileId();
      if (!profileId) {
        toast({
          title: "Errore",
          description: "Profilo non trovato",
          variant: "destructive"
        });
        return;
      }

      await fantasMiaDB.init();
      
      const newStory = {
        id: crypto.randomUUID(),
        title: title.trim(),
        text: content.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mode: 'STRANGE_FACT',
        ownerProfileId: profileId,
        hasImage: false
      };
      
      await fantasMiaDB.saveAMStory(newStory);

      // Emit events for UI updates
      window.dispatchEvent(new CustomEvent('am-story-updated', { 
        detail: { storyId: newStory.id, action: 'created' } 
      }));
      window.dispatchEvent(new CustomEvent('am:changed'));

      toast({
        title: "Successo",
        description: "Storia salvata nell'archivio AM"
      });

      navigate('/user-archive');
    } catch (error) {
      console.error('Error saving story:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la storia",
        variant: "destructive"
      });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  return (
    <>
      <ProfileIndicator />
      
      {/* Fixed Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Back Button - Top Left */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/create-story')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          {/* Page Title - Center */}
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Fatto Strano che Ti È Capitato
          </h1>
          
          {/* Home Button - Top Right */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profiles')}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pt-20">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Title Input */}
          <Card>
            <CardHeader>
              <CardTitle>Titolo del Fatto Strano</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inserisci il titolo del tuo fatto strano..."
                className="text-lg"
              />
            </CardContent>
          </Card>

          {/* Content Input */}
          <Card>
            <CardHeader>
              <CardTitle>Racconta il Fatto Strano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Racconta qui il fatto strano che ti è capitato..."
                  className="min-h-[300px] text-base leading-relaxed"
                />
              ) : (
                <div 
                  className="min-h-[300px] p-3 rounded-md border bg-background text-base leading-relaxed cursor-pointer hover:bg-slate-50"
                  onClick={() => setIsEditing(true)}
                >
                  {content || "Clicca qui per raccontare il tuo fatto strano..."}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <ActionButtonGroup
                  content={content}
                  language="italian"
                  onEdit={handleEditToggle}
                  onSave={handleSave}
                  showSave={true}
                  showEdit={true}
                  showShare={true}
                  showTranslate={true}
                />
              </div>

              {/* Modify Menu */}
              {content && (
                <ModifyMenu
                  storyContent={content}
                  storyTitle={title}
                  isEditing={isEditing}
                  onEditToggle={handleEditToggle}
                  onContentChange={handleContentChange}
                  className="mt-4"
                />
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              size="lg"
              className="px-8"
              disabled={!title.trim() || !content.trim()}
            >
              Salva Fatto Strano
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MagicStoryEditor;