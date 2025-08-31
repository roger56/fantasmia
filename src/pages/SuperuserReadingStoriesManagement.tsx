import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, BookOpen, Edit, Trash2, Plus, Image } from 'lucide-react';
import { saveReadingStory, getReadingStories, updateReadingStory, deleteReadingStory, ReadingStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { fantasmiaDB } from '@/utils/imageStorage';

const SuperuserReadingStoriesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState<ReadingStory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [storiesWithImages, setStoriesWithImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
      loadStories();
    } else {
      navigate('/superuser');
    }
  }, [navigate]);

  const loadStories = async () => {
    const readingStories = await getReadingStories();
    setStories(readingStories.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
    
    // Check which stories have images in IndexedDB
    const imagesSet = new Set<string>();
    for (const story of readingStories) {
      const hasImage = await fantasmiaDB.hasImage(story.id);
      if (hasImage) {
        imagesSet.add(story.id);
      }
    }
    setStoriesWithImages(imagesSet);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Errore",
        description: "Il contenuto è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 2000) {
      toast({
        title: "Errore",
        description: "Il contenuto non può superare i 2000 caratteri",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate titles (only if not editing the same story)
    const existingStory = stories.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (existingStory && (!editingStory || existingStory.id !== editingStory.id)) {
      toast({
        title: "Errore",
        description: "Esiste già una storia con questo titolo",
        variant: "destructive",
      });
      return;
    }

    if (editingStory) {
      // Update existing story
      await updateReadingStory(editingStory.id, { title, content });
      toast({
        title: "Successo",
        description: "Storia aggiornata con successo",
      });
    } else {
      // Create new story
      const storyId = crypto.randomUUID();
      const newStory: ReadingStory = {
        id: storyId,
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: imageUrl || undefined
      };

      // Save image to IndexedDB if present
      if (imageFile && imageUrl) {
        try {
          const { uploadImageToStorage, fantasmiaDB } = await import('@/utils/imageStorage');
          
          // Convert file to blob
          const blob = new Blob([imageFile], { type: imageFile.type });
          
          try {
            // Try to upload to Supabase Storage
            const publicUrl = await uploadImageToStorage(blob, storyId, title);
            newStory.image_url = publicUrl;
          } catch (storageError) {
            console.warn('Storage upload failed, saving only locally:', storageError);
          }
          
          // Always save locally for persistence
          await fantasmiaDB.saveImage(storyId, blob);
        } catch (error) {
          console.error('Error saving image:', error);
        }
      }
      await saveReadingStory(newStory);
      toast({
        title: "Successo",
        description: "Storia creata con successo",
      });
    }

    setTitle('');
    setContent('');
    setImageFile(null);
    setImageUrl('');
    setIsEditing(false);
    setEditingStory(null);
    loadStories();
  };

  const handleEdit = (story: ReadingStory) => {
    setEditingStory(story);
    setTitle(story.title);
    setContent(story.content);
    setImageUrl(story.image_url || '');
    setIsEditing(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setImageUrl(tempUrl);
    }
  };

  const handleDelete = async (id: string) => {
    if (await deleteReadingStory(id)) {
      toast({
        title: "Successo",
        description: "Storia eliminata con successo",
      });
      loadStories();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setImageFile(null);
    setImageUrl('');
    setIsEditing(false);
    setEditingStory(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/superuser')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">📖 Gestione Storie da Leggere</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                {isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? 'Modifica Storia' : 'Inserisci nuova storia'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titolo
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Inserisci il titolo della storia..."
                  maxLength={100}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contenuto ({content.length}/2000 caratteri)
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi qui il contenuto della storia..."
                  rows={8}
                  maxLength={2000}
                  className="resize-none text-sm"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Immagine (Opzionale)
                </label>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                  {imageUrl && (
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-slate-600 mb-2">Anteprima immagine:</p>
                      <img 
                        src={imageUrl} 
                        alt="Anteprima" 
                        className="max-w-full h-32 object-contain rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {isEditing && (
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                )}
                <Button 
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim()}
                  className="flex-1"
                >
                  {isEditing ? 'Aggiorna' : 'Salva'} Storia
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stories List */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-4 h-4" />
                Storie Esistenti ({stories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {stories.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Nessuna storia creata</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stories.map((story) => (
                    <div key={story.id} className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate" title={story.title}>
                              {story.title}
                            </h3>
                            {/* Image status icon */}
                            <div title={storiesWithImages.has(story.id) ? 'Immagine presente' : 'Immagine assente'}>
                              <Image 
                                className={`w-4 h-4 ${
                                  storiesWithImages.has(story.id) 
                                    ? 'text-green-600' 
                                    : 'text-red-500'
                                }`}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(story.updated_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(story)}
                            title="Modifica storia"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Elimina storia"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare la storia "{story.title}"? 
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(story.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperuserReadingStoriesManagement;