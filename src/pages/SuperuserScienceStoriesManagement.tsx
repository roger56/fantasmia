import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { saveScienceStory, ScienceStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const SuperuserScienceStoriesManagement = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
    } else {
      navigate('/superuser');
    }
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setImageUrl(tempUrl);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Errore",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Generate a unique ID for the story
      const storyId = crypto.randomUUID();
      
      // Create the science story object
      const newStory: ScienceStory = {
        id: storyId,
        title: title.trim(),
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: 'superuser',
        image_url: imageUrl || undefined
      };

      // Save the story
      saveScienceStory(newStory);

      toast({
        title: "Successo",
        description: "Storia scientifica salvata con successo"
      });

      // Reset form
      setTitle('');
      setContent('');
      setImageFile(null);
      setImageUrl('');

      // Navigate back to management view
      navigate('/superuser-science-stories-view');
    } catch (error) {
      console.error('Error saving science story:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser-science-stories-view')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">🔬 Nuova Storia Scientifica</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inserisci i dettagli della storia scientifica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Titolo della Storia *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. La luce che si piega"
                  className="w-full"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Contenuto della Storia *
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi qui la storia che spiega il fenomeno fisico con esempi concreti e vicini al vissuto dei bambini..."
                  className="min-h-80 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Immagine (Opzionale)
                </label>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                  {imageUrl && (
                    <div className="border rounded-lg p-4">
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/superuser-science-stories-view')}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvataggio...' : 'Salva Storia'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SuperuserScienceStoriesManagement;