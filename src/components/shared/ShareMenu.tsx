import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Share2, Copy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareMenuProps {
  storyContent: string;
  storyTitle: string;
  className?: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({
  storyContent,
  storyTitle,
  className = ""
}) => {
  const { toast } = useToast();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storyContent);
      toast({
        title: "Testo copiato",
        description: "Il testo della storia è stato copiato negli appunti"
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = storyContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Testo copiato",
        description: "Il testo della storia è stato copiato negli appunti"
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(storyTitle);
    const body = encodeURIComponent(storyContent);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    
    try {
      window.open(mailtoUrl, '_blank');
    } catch (error) {
      toast({
        title: "Funzione in sviluppo",
        description: "L'integrazione email è in fase di sviluppo",
        variant: "default"
      });
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Condividi
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleCopyToClipboard} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copia negli appunti
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmailShare} className="cursor-pointer">
            <Mail className="w-4 h-4 mr-2" />
            Invia via mail
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ShareMenu;