import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface CopyrightWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModify: () => void;
  onProceed: () => void;
}

const CopyrightWarningDialog: React.FC<CopyrightWarningDialogProps> = ({
  open,
  onOpenChange,
  onModify,
  onProceed
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <AlertDialogTitle>Attenzione ai diritti d'autore</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              Alcuni nomi di personaggi famosi (es. Cenerentola, Biancaneve, Pollicino) sono 
              soggetti a diritti d'autore.
            </p>
            <p>
              Se presenti nella tua storia, i disegni potrebbero non essere generati correttamente. 
              È consigliato modificare i nomi (es. Caterina, Nevebianca, Indicino).
            </p>
            <p className="font-medium">
              Vuoi procedere o modificare il testo?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel onClick={onModify}>
            Modifica
          </AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>
            Prosegui
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CopyrightWarningDialog;