import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface CopyrightWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedStyle?: string;
}

const CopyrightWarningDialog: React.FC<CopyrightWarningDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  selectedStyle,
}) => {
  console.log("CopyrightDialog rendered with selectedStyle:", selectedStyle);

  const styleLabels: Record<string, string> = {
    fumetto: "Fumetto",
    fotografico: "Fotografico",
    astratto: "Astratto",
    manga: "Manga",
    acquarello: "Acquarello",
    carboncino: "Carboncino",
    sketch: "Schizzo da colorare",
  };

  const handleConfirm = () => {
    console.log("Confirm button clicked");
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    console.log("Cancel button clicked");
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
        <DialogDescription id="copyright-warning-desc" className="space-y-4">
          {selectedStyle && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm font-medium text-foreground">
                Stile selezionato: <span className="text-primary">{styleLabels[selectedStyle] || selectedStyle}</span>
              </div>
            </div>
          )}
          <span className="block text-foreground">
            I disegni di storie contenenti personaggi soggetti a diritto d'autore (es. Cenerentola, Pinocchio,
            Biancaneve, ecc.) non saranno effettuati.
          </span>
          <span className="block font-medium text-foreground">
            Confermi di aver preso visione di questa informazione e di voler procedere?
          </span>
        </DialogDescription>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>Confermo e Procedo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyrightWarningDialog;
