import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface EditTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText: string;
  onSave: (newText: string) => void;
  title?: string;
}

const EditTextDialog: React.FC<EditTextDialogProps> = ({
  open,
  onOpenChange,
  initialText,
  onSave,
  title = "Modifica Testo"
}) => {
  const [editedText, setEditedText] = useState(initialText);

  const handleSave = () => {
    onSave(editedText);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEditedText(initialText);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="story-text">Testo della storia</Label>
            <Textarea
              id="story-text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={12}
              className="mt-2"
              placeholder="Scrivi qui il testo della storia..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salva Modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTextDialog;