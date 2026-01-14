import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordRevealCardProps {
  password: string | null;
  onClose: () => void;
  title?: string;
  description?: string;
}

const PasswordRevealCard: React.FC<PasswordRevealCardProps> = ({
  password,
  onClose,
  title = 'Password Generata',
  description = 'Questa password verrà mostrata solo ora. Copiala e conservala in un luogo sicuro.'
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!password) return;
    
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast({
        title: 'Copiato!',
        description: 'Password copiata negli appunti',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Impossibile copiare la password',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={!!password} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Credenziali di accesso per il nuovo utente
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {description}
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 p-4 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
          <code className="flex-1 font-mono text-lg font-bold text-slate-800 select-all break-all">
            {password}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={copied ? 'bg-green-100 border-green-500' : ''}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1 text-green-600" />
                <span className="text-green-600">Copiata!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copia
              </>
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Ho copiato la password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordRevealCard;
