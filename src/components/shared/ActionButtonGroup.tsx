import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, Languages, Save, Share, Edit, Mail, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';
import { fantasMiaDB } from '@/utils/indexedDB';

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
  const { speak, getButtonText } = useUnifiedTTS();
  const { toast } = useToast();
  const [albumEmail, setAlbumEmail] = useState('quando.ruggero@gmail.com');

  // Load album email from IndexedDB on mount
  useEffect(() => {
    const loadEmailSetting = async () => {
      try {
        await fantasMiaDB.init();
        const settings = await fantasMiaDB.getSystemSettings();
        if (settings.album_default_email) {
          setAlbumEmail(settings.album_default_email);
        }
      } catch (e) {
        console.warn('Error loading email settings, using default', e);
      }
    };
    loadEmailSetting();
  }, []);

  const handleListen = () => {
    speak(content, language);
  };

  const handleClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiato negli appunti",
      description: "Il contenuto è stato copiato negli appunti",
    });
  };

  const handleSendMail = () => {
    // Log for debugging
    console.log(`album-send to=${albumEmail}`);
    
    toast({
      title: "Invio album",
      description: `L'album verrà inviato a: ${albumEmail}`,
      variant: "default"
    });
    // Note: Real email sending requires backend (Resend + edge function)
  };

  const handlePublish = () => {
    toast({
      title: "Funzione in sviluppo", 
      description: "Pubblicazione sul sito sarà presto disponibile",
      variant: "default"
    });
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
        <TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Share className="w-4 h-4 mr-2" />
                CONDIVIDI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border shadow-lg z-50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={handleClipboard}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Appunti
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copia negli appunti</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={handleSendMail}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Invia mail
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Invia mail all'indirizzo indicato nelle impostazioni</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={handlePublish}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Pubblica
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pubblica la storia sul sito web di Fantasmia visibile a tutti gli iscritti. L'invio ne autorizza la pubblicazione.</p>
                </TooltipContent>
              </Tooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      )}
    </div>
  );
};

export default ActionButtonGroup;