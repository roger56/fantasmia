import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DrawingPreviewModal from './DrawingPreviewModal';
import { fantasmiaDB } from '@/utils/imageStorage';
import { AuthBridge } from '@/utils/authBridge';

interface MediaButtonProps {
  storyId?: string;
  storyTitle?: string;
  storyContent: string;
  onImageAssociated?: (imageUrl: string) => void;
  className?: string;
  userId?: string; // Backward compatibility
}

export const MediaButton: React.FC<MediaButtonProps> = ({
  storyId,
  storyTitle,
  storyContent,
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
      const hasImage = await fantasmiaDB.hasImage(storyId);
      setHasAssociatedImage(hasImage);
    };
    checkExistingImage();
  }, [storyId]);

  const handleGenerateImage = async () => {
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
    
    try {
      // Create a simple prompt from story content
      const prompt = `Create a child-friendly illustration for this story: ${storyContent.substring(0, 500)}`;
      
      // Simulate image generation (replace with actual API call)
      // For now, using a placeholder approach
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      // Generate a placeholder image URL (replace with actual generated image)
      const placeholderImageUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#e2e8f0"/>
          <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748b">
            Generated Image for: ${storyTitle}
          </text>
        </svg>
      `)}`;
      
      setGeneratedImageUrl(placeholderImageUrl);
      
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Errore",
        description: "Impossibile generare l'immagine. Riprova più tardi.",
        variant: "destructive"
      });
      setShowPreview(false);
    } finally {
      setIsGenerating(false);
    }
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
      
      await fantasmiaDB.saveImage(storyId, blob);
      
      setHasAssociatedImage(true);
      setShowPreview(false);
      setGeneratedImageUrl(null);
      
      onImageAssociated?.(imageUrl);
      
      toast({
        title: "Disegno salvato",
        description: "Il disegno è stato associato alla storia con successo",
        variant: "default"
      });
      
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
    handleGenerateImage();
  };

  const handleUploadImage = async () => {
    // Only for superuser
    const authStatus = await AuthBridge.isAuthenticated();
    const isSuperuser = authStatus.userName === 'superuser';
    
    if (!isSuperuser) {
      toast({
        title: "Accesso limitato",
        description: "Il caricamento da PC è disponibile solo per i Superuser",
        variant: "destructive"
      });
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // If overriding existing image, delete it first
          if (hasAssociatedImage && storyId) {
            // Delete existing image
            try {
              await fantasmiaDB.init();
            } catch (error) {
              console.error('Error deleting existing image:', error);
            }
          }
          
          // Save new image
          const blob = new Blob([file], { type: file.type });
          await fantasmiaDB.saveImage(storyId, blob);
          
          setHasAssociatedImage(true);
          
          const imageUrl = URL.createObjectURL(file);
          onImageAssociated?.(imageUrl);
          
          toast({
            title: "Immagine caricata",
            description: "L'immagine è stata caricata e associata alla storia",
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
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <Button
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Palette className="w-4 h-4" />
          {isGenerating ? 'Generando...' : hasAssociatedImage ? 'Nuovo Disegno' : 'Crea Disegno'}
        </Button>
        
        {/* Superuser upload button - rendered conditionally */}
        <SuperuserUploadButton onUpload={handleUploadImage} />
      </div>

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

// Component that conditionally renders upload button for superusers
const SuperuserUploadButton: React.FC<{ onUpload: () => void }> = ({ onUpload }) => {
  const [isSuperuser, setIsSuperuser] = React.useState(false);

  React.useEffect(() => {
    const checkSuperuser = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      setIsSuperuser(authStatus.userName === 'superuser');
    };
    checkSuperuser();
  }, []);

  if (!isSuperuser) return null;

  return (
    <Button
      onClick={onUpload}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Upload className="w-4 h-4" />
      Carica da PC
    </Button>
  );
};

export default MediaButton;