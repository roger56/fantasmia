import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CopyrightWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const CopyrightWarningDialog: React.FC<CopyrightWarningDialogProps> = ({
  open,
  onOpenChange,
  onConfirm
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="copyright-warning-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Attenzione Copyright
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="copyright-warning-desc" className="space-y-3">
          <span className="block">
            I disegni di storie contenenti personaggi soggetti a diritto d'autore 
            (es. Cenerentola, Pinocchio, Biancaneve, ecc.) non saranno effettuati.
          </span>
          <span className="block font-medium">
            Confermi di aver preso visione di questa informazione e di voler procedere?
          </span>
        </DialogDescription>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>
            Confermo e Procedo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyrightWarningDialog;