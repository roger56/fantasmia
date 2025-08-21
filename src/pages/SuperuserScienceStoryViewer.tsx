import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Save, Upload, Volume2, Palette, Camera, ImageIcon, Video, Film, Music, ChevronDown, Edit, PenTool, Wand2, Feather } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { getScienceStories, updateScienceStory, ScienceStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import HomeButton from '@/components/HomeButton';

const SuperuserScienceStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<ScienceStory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { isPlaying, isPaused, speak, stop, getButtonText } = useTTS();

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
      loadStory();
    } else {
      navigate('/superuser');
    }
  }, [navigate, id]);

  const loadStory = () => {
    if (!id) return;
    
    const stories = getScienceStories();
    const foundStory = stories.find(s => s.id === id);
    
    if (foundStory) {
      setStory(foundStory);
      setTitle(foundStory.title);
      setContent(foundStory.content);
      setImageUrl(foundStory.image_url || '');
    } else {
      toast({
        title: "Errore",
        description: "Storia non trovata",
        variant: "destructive"
      });
      navigate('/superuser-science-stories-view');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setImageUrl(tempUrl);
    }
  };

  const handleSave = () => {
    if (!story || !title.trim() || !content.trim()) {
      toast({
        title: "Errore",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    updateScienceStory(story.id, {
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl || undefined
    });

    setStory(prev => prev ? {
      ...prev,
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl || undefined,
      updated_at: new Date().toISOString()
    } : null);

    setIsEditing(false);
    
    toast({
      title: "Successo",
      description: "Storia aggiornata con successo"
    });
  };

  const handleCancel = () => {
    if (story) {
      setTitle(story.title);
      setContent(story.content);
      setImageUrl(story.image_url || '');
    }
    setIsEditing(false);
  };

  const handleListen = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(content, 'italian');
    }
  };

  if (!isAuthenticated || !story) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/superuser-science-stories-view')}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-800">🔬 {story.title}</h1>
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Leggi
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => speak(content, 'italian')}>
                    👨 Voce Uomo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => speak(content, 'italian')}>
                    👩 Voce Donna
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => speak(content, 'italian')}>
                    👦 Voce Bambino
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => speak(content, 'italian')}>
                    👧 Voce Bambina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* MEDIA Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    <span className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      📺 MEDIA
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px]" align="start">
                  {imageUrl ? (
                    <DropdownMenuItem onClick={() => window.open(imageUrl, '_blank')} className="cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Visualizza immagine
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Nessuna immagine
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* MODIFICA Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    <span className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      📝 MODIFICA
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px]" align="start">
                  <DropdownMenuItem onClick={() => setIsEditing(!isEditing)} className="cursor-pointer">
                    <PenTool className="w-4 h-4 mr-2" />
                    📝 Modifica testo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Annulla
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salva
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {isEditing ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titolo della storia"
                    className="text-lg font-semibold"
                  />
                ) : (
                  story.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Contenuto della storia"
                    className="min-h-96 resize-none"
                  />
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Immagine (Opzionale)
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full"
                    />
                    {imageUrl && (
                      <div className="mt-4 border rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-2">Anteprima immagine:</p>
                        <img 
                          src={imageUrl} 
                          alt="Anteprima" 
                          className="max-w-full h-48 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <ScrollArea 
                    className="border rounded-md p-4"
                    style={{ 
                      minHeight: '20em', 
                      maxHeight: '40em' 
                    }}
                  >
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                      {story.content}
                    </div>
                  </ScrollArea>
                  {imageUrl && (
                    <div className="mt-4 border rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-2">Immagine associata:</p>
                      <img 
                        src={imageUrl} 
                        alt="Immagine storia" 
                        className="max-w-full h-48 object-contain rounded border cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-slate-500">
                <span>Creata il {new Date(story.created_at).toLocaleDateString('it-IT')}</span>
                {story.updated_at !== story.created_at && (
                  <span>Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SuperuserScienceStoryViewer;