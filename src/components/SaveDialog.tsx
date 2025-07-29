import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  title?: string;
  placeholder?: string;
  saveButtonText?: string;
  dialogTitle?: string;
}

const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  title = '',
  placeholder = "Inserisci il titolo...",
  saveButtonText = "Salva",
  dialogTitle = "Salva la tua storia"
}) => {
  const [storyTitle, setStoryTitle] = useState(title);
  const { toast } = useToast();

  const handleSave = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci un titolo per la storia!",
        variant: "destructive"
      });
      return;
    }
    onSave(storyTitle);
    setStoryTitle('');
  };

  const handleClose = () => {
    setStoryTitle('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card>
          <CardHeader>
            <CardTitle>{dialogTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titolo della storia:</label>
              <Input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                {saveButtonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SaveDialog;