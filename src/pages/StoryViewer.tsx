import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Volume2, Edit, Save, Globe, Share2, Copy, Mail } from 'lucide-react';
import { getStories, saveStory, Story } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import HomeButton from '@/components/HomeButton';
import CreativeMediaMenu from '@/components/shared/CreativeMediaMenu';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import TextImprover from '@/components/shared/TextImprover';

const StoryViewer = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [showTextImprover, setShowTextImprover] = useState(false);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [isSupuserMode, setIsSuperuserMode] = useState(false);
  
  const { speak, getButtonText } = useTTS();
  const { isTranslated, isTranslating, translateContent, getCurrentLanguage } = useTranslation();

  // Format CSS content by removing guided questions
  const formatCSSContent = (content: string) => {
    if (!content) return content;
    
    const cssQuestions = [
      'Domanda iniziale:',
      'Chi lo vede per primo?',
      'Che cosa succede nel villaggio / a scuola / in casa?',
      'Chi è contento e chi no?',
      'C\'è qualcuno che dice NO?',
      'Qual è il momento più buffo o spaventoso?',
      'Cosa decide il personaggio?',
      'E adesso com\'è il mondo?'
    ];
    
    let formattedContent = content;
    
    // Remove question headers and keep only user answers
    cssQuestions.forEach(question => {
      const regex = new RegExp(`${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gi');
      formattedContent = formattedContent.replace(regex, '');
    });
    
    // Clean up extra whitespace and line breaks
    formattedContent = formattedContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
    
    return formattedContent;
  };

  useEffect(() => {
    const loadStory = async () => {
      const stories = await getStories();
      const foundStory = stories.find(s => s.id === storyId);
      if (foundStory) {
        setStory(foundStory);
        setEditedContent(foundStory.content || '');
        setEditedTitle(foundStory.title || '');
        
        // Check if we're in Superuser mode
        const currentPath = window.location.pathname;
        setIsSuperuserMode(currentPath.includes('superuser'));
        
        // Load image if available
        if (foundStory.image_url) {
          // Try to get from cache first, then fallback to URL
          const { getStoryImage } = await import('@/utils/imageStorage');
          const cachedImage = await getStoryImage(foundStory.id, foundStory.image_url);
          setStoryImage(cachedImage);
        }
      }
    };
    loadStory();
  }, [storyId]);

  const handleTranslate = async () => {
    if (!story) return;
    
    await translateContent(
      editedContent,
      story.title,
      setEditedContent,
      setTranslatedTitle
    );
  };

  const handleTextToSpeech = () => {
    speak(editedContent, getCurrentLanguage());
  };

  const handleSaveEdit = async () => {
    if (story) {
      const updatedStory = {
        ...story,
        title: editedTitle,
        content: editedContent,
        lastModified: new Date().toISOString(),
        language: isTranslated ? ('english' as const) : ('italian' as const)
      };
      
      // If we have a translated title, update that too
      if (isTranslated && translatedTitle) {
        updatedStory.title = translatedTitle;
      }
      
      await saveStory(updatedStory);
      setStory(updatedStory);
      setIsEditing(false);
      
      toast({
        title: "Storia aggiornata",
        description: `Le modifiche sono state salvate con successo${isTranslated ? ' in inglese' : ''}`
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${displayTitle}\n\n${editedContent}`);
      toast({
        title: "Copiato negli appunti",
        description: "Il testo della storia è stato copiato negli appunti"
      });
    } catch (err) {
      toast({
        title: "Errore",
        description: "Non è stato possibile copiare il testo",
        variant: "destructive"
      });
    }
  };

  const handleMailShare = () => {
    toast({
      title: "Funzione in sviluppo",
      description: "La condivisione via email sarà presto disponibile"
    });
  };

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-600">Storia non trovata</p>
        </div>
      </div>
    );
  }

  const displayTitle = isTranslated && translatedTitle ? translatedTitle : (isEditing ? editedTitle : story.title);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleTranslate} 
              variant="outline" 
              disabled={isTranslating}
              className="w-full sm:w-auto"
            >
              <Globe className="w-4 h-4 mr-2" />
              {isTranslating ? 'Traduzione...' : (isTranslated ? 'ITALIANO' : 'INGLESE')}
            </Button>
            
            <Button onClick={handleTextToSpeech} variant="outline" className="w-full sm:w-auto">
              <Volume2 className="w-4 h-4 mr-2" />
              {getButtonText()}
            </Button>
            
            <CreativeMediaMenu 
              storyContent={editedContent}
              storyTitle={displayTitle}
              storyId={story.id}
              onImageAssociated={(imageUrl) => setStoryImage(imageUrl)}
              className="w-full sm:w-auto"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Share2 className="w-4 h-4 mr-2" />
                  CONDIVIDI
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleMailShare}>
                  <Mail className="w-4 h-4 mr-2" />
                  Mail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copia appunti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {!isEditing && !showTextImprover ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Edit className="w-4 h-4 mr-2" />
                    MODIFICA
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    📝 Modifica testo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowTextImprover(true)}>
                    🤖 Migliora testo (AI)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: "Funzione in sviluppo", description: "Generazione poesia sarà presto disponibile" })}>
                    📝 Poesia
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                  Annulla
                </Button>
                <Button onClick={handleSaveEdit} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
              </div>
            ) : showTextImprover ? (
              <Button variant="outline" onClick={() => setShowTextImprover(false)} className="w-full sm:w-auto">
                Annulla
              </Button>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            {isEditing ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Titolo della Storia
                </label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold"
                  placeholder="Inserisci il titolo..."
                />
              </div>
            ) : (
              <CardTitle className="text-2xl">{displayTitle}</CardTitle>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>Autore: {story.authorName}</span>
              <span>Modalità: {story.mode}</span>
              <span>Modificato: {new Date(story.lastModified).toLocaleDateString()}</span>
              {isTranslated && <span className="text-blue-600 font-medium">🇬🇧 English</span>}
            </div>
          </CardHeader>
          <CardContent>
            {/* Story Image - show if available */}
            {storyImage && (
              <div className="mb-6">
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    {isSupuserMode ? '🖼️ Immagine della storia:' : '🎨 Immagine associata:'}
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={storyImage} 
                      alt={`Immagine per "${displayTitle}"`}
                      className="max-w-full h-auto max-h-64 object-contain rounded border"
                    />
                  </div>
                  {isSupuserMode && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Come Superuser, puoi visualizzare e sostituire questa immagine usando il pulsante MEDIA
                    </p>
                  )}
                </div>
              </div>
            )}

            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="resize-none text-base leading-relaxed"
                style={{ height: 'auto', minHeight: '200px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 400) + 'px';
                }}
              />
            ) : (
              <div 
                className="text-base leading-relaxed whitespace-pre-wrap p-4 border rounded-lg"
                style={{ 
                  minHeight: 'auto',
                  maxHeight: '60vh',
                  overflowY: 'auto'
                }}
              >
                {story?.mode === 'CSS' ? formatCSSContent(editedContent) : editedContent}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TextImprover */}
        {showTextImprover && (
          <div className="mt-6">
            <TextImprover 
              storyContent={editedContent}
              onContentChange={setEditedContent}
              storyId={story.id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
