import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Palette, Video, Volume2, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DrawingPreviewModal from './DrawingPreviewModal';
import { fantasmiaDB } from '@/utils/imageStorage';
import { AuthBridge } from '@/utils/authBridge';

interface CreativeMediaMenuProps {
  storyContent: string;
  storyTitle?: string;
  storyId?: string;
  onImageAssociated?: (imageUrl: string) => void;
  className?: string;
}

export const CreativeMediaMenu: React.FC<CreativeMediaMenuProps> = ({
  storyContent,
  storyTitle,
  storyId,
  onImageAssociated,
  className = ""
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [hasAssociatedImage, setHasAssociatedImage] = useState(false);

  React.useEffect(() => {
    // Check if story already has an associated image
    const checkExistingImage = async () => {
      if (storyId) {
        const hasImage = await fantasmiaDB.hasImage(storyId);
        setHasAssociatedImage(hasImage);
      }
    };
    checkExistingImage();
  }, [storyId]);

  const handleImageGeneration = async (style: string) => {
    // Check if user is superuser (can override existing images)
    const authStatus = await AuthBridge.isAuthenticated();
    const isSuperuser = authStatus.userName === 'superuser';
    
    if (hasAssociatedImage && !isSuperuser) {
      toast({
        title: "Immagine già presente",
        description: "Questa storia ha già un disegno associato. Non è possibile generarne uno nuovo.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setShowPreview(true);
    setGeneratedImageUrl(null); // Reset previous image
    
    try {
      console.log('Starting image generation with style:', style);
      console.log('Story content:', storyContent.substring(0, 100));
      console.log('Story ID:', storyId);
      console.log('Story Title:', storyTitle);
      
      // Call the Edge Function to generate image
      const response = await fetch('https://aomisprfxjatoibvcmhh.supabase.co/functions/v1/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbWlzcHJmeGphdG9pYnZjbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjEwMzAsImV4cCI6MjA3MDIzNzAzMH0.8rp5hX1Hj2UgcIgijf3YJ5A30GJW_l3yRcLfO6hiURw'
        },
        body: JSON.stringify({
          prompt: storyContent.substring(0, 500),
          style: style,
          storyId: storyId,
          storyTitle: storyTitle,
          userId: authStatus.userName || 'anonymous'
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Generated image data:', data);
      
      if (!data.imageUrl) {
        throw new Error('Nessuna immagine ricevuta dal server');
      }
      
      setGeneratedImageUrl(data.imageUrl);
      
      toast({
        title: "Immagine generata",
        description: `Stile: ${style}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare l'immagine. Riprova più tardi.",
        variant: "destructive"
      });
      setShowPreview(false);
      setGeneratedImageUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVideoGeneration = (type: string) => {
    toast({
      title: "Funzione in sviluppo",
      description: `Generazione video ${type} sarà presto disponibile`
    });
  };

  const handleMusicGeneration = () => {
    toast({
      title: "Funzione in sviluppo", 
      description: "Generazione musica sarà presto disponibile"
    });
  };

  const handleAcceptImage = async (imageUrl: string) => {
    try {
      // If superuser is overriding, delete existing image first
      const authStatus = await AuthBridge.isAuthenticated();
      const isSuperuser = authStatus.userName === 'superuser';
      
      if (hasAssociatedImage && isSuperuser && storyId) {
        // Delete existing image using fantasmiaDB method
        try {
          await fantasmiaDB.init();
          // Use direct IndexedDB access
          const request = indexedDB.open('FantasmiaDB', 1);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            store.delete(storyId);
          };
        } catch (error) {
          console.error('Error deleting existing image:', error);
        }
      }
      
      // Convert image URL to blob and save to IndexedDB
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      if (storyId) {
        await fantasmiaDB.saveImage(storyId, blob);
      }
      
      setHasAssociatedImage(true);
      setShowPreview(false);
      setGeneratedImageUrl(null);
      
      onImageAssociated?.(imageUrl);
      
      toast({
        title: "Disegno salvato",
        description: "Il disegno è stato associato alla storia con successo",
        variant: "default"
      });
      
      // Trigger page refresh to update icon status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare l'immagine",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateImage = () => {
    setGeneratedImageUrl(null);
    // Will regenerate with the last selected style
    toast({
      title: "Info",
      description: "Seleziona nuovamente un stile di disegno per rigenerare",
      variant: "default"
    });
    setShowPreview(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`flex items-center gap-2 ${className}`}>
            <Palette className="w-4 h-4" />
            MEDIA
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {/* Sottomenu Disegno */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Image className="w-4 h-4 mr-2" />
              Disegno
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem 
                onClick={() => handleImageGeneration('fumetto')}
                disabled={isGenerating}
              >
                🎨 Fumetto
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleImageGeneration('fotografico')}
                disabled={isGenerating}
              >
                📸 Fotografico
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleImageGeneration('astratto')}
                disabled={isGenerating}
              >
                🎭 Astratto
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleImageGeneration('manga')}
                disabled={isGenerating}
              >
                🎌 Manga
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleImageGeneration('acquarello')}
                disabled={isGenerating}
              >
                🖌️ Acquarello
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleImageGeneration('carboncino')}
                disabled={isGenerating}
              >
                ✏️ Carboncino
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Carica da PC option for Superuser */}
          {React.useMemo(() => {
            const currentUser = localStorage.getItem('currentUser');
            const user = currentUser ? JSON.parse(currentUser) : null;
            const isSuperuser = user?.name?.toLowerCase() === 'superuser';
            
            return isSuperuser && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && storyId) {
                      try {
                        // Convert file to blob and save directly to fantasmiaDB
                        await fantasmiaDB.saveImage(storyId, file);
                        
                        setHasAssociatedImage(true);
                        onImageAssociated?.(URL.createObjectURL(file));
                        
                        toast({
                          title: "Immagine caricata",
                          description: "L'immagine è stata associata alla storia con successo",
                          variant: "default"
                        });
                      } catch (error) {
                        console.error('Error uploading image:', error);
                        toast({
                          title: "Errore",
                          description: "Impossibile caricare l'immagine",
                          variant: "destructive"
                        });
                      }
                    }
                  };
                  input.click();
                }}>
                  <Image className="w-4 h-4 mr-2" />
                  Carica da PC
                </DropdownMenuItem>
              </>
            );
          }, [storyId, storyTitle, onImageAssociated])}

          <DropdownMenuSeparator />

          {/* Sottomenu Filmato */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Video className="w-4 h-4 mr-2" />
              Filmato
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleVideoGeneration('standard')}>
                🎬 Standard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVideoGeneration('avanzato')}>
                🎯 Avanzato
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Opzione Musica di sottofondo */}
          <DropdownMenuItem onClick={handleMusicGeneration}>
            <Volume2 className="w-4 h-4 mr-2" />
            Musica di sottofondo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DrawingPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setGeneratedImageUrl(null);
        }}
        imageUrl={generatedImageUrl}
        storyTitle={storyTitle}
        storyId={storyId}
        onAccept={handleAcceptImage}
        onRegenerate={handleRegenerateImage}
        isGenerating={isGenerating}
      />
    </>
  );
};

export default CreativeMediaMenu;