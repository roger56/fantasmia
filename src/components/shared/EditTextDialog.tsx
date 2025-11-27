import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import SpeechToText from '@/components/SpeechToText';

interface EditTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText: string;
  initialTitle?: string;
  onSave: (newText: string, newTitle?: string) => void;
  title?: string;
  showTitleField?: boolean;
}

const EditTextDialog: React.FC<EditTextDialogProps> = ({
  open,
  onOpenChange,
  initialText,
  initialTitle = "",
  onSave,
  title = "Modifica Testo",
  showTitleField = false
}) => {
  const [editedText, setEditedText] = useState(initialText);
  const [editedTitle, setEditedTitle] = useState(initialTitle);

  const handleSave = () => {
    console.debug('EDIT:title-save-ok', { 
      titleLen: showTitleField ? editedTitle.length : 0,
      textLen: editedText.length 
    });
    onSave(editedText, showTitleField ? editedTitle : undefined);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      console.debug('EDIT:title-open', { showTitleField });
      setEditedText(initialText);
      setEditedTitle(initialTitle);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby="dlg-desc-edit-text">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription id="dlg-desc-edit-text">
          Modifica il contenuto del testo della storia.
        </DialogDescription>

        <div className="space-y-4">
          {showTitleField && (
            <div>
              <Label htmlFor="story-title">Titolo della storia</Label>
              <input
                id="story-title"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Inserisci il titolo della storia..."
              />
            </div>
          )}
          <div>
            <Label htmlFor="story-text">Testo della storia</Label>
            <div className="flex gap-2 mt-2">
              <Textarea
                id="story-text"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={showTitleField ? 10 : 12}
                placeholder="Scrivi qui il testo della storia..."
              />
              <SpeechToText
                onResult={(transcript) => {
                  const newText = editedText + (editedText ? ' ' : '') + transcript;
                  setEditedText(newText);
                }}
                className="shrink-0"
              />
            </div>
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