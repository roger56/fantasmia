import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Upload, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import { fantasMiaDB } from '@/utils/indexedDB';
import { parseDailyStoriesFile, validateDailyStory, type DailyStory } from '@/utils/dailyStoryParser';
import { useToast } from '@/hooks/use-toast';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';

const SuperuserDailyStoriesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, isAuthorized } = useSuperuserGuard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stories, setStories] = useState<DailyStory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<DailyStory | null>(null);
  const [viewingStory, setViewingStory] = useState<DailyStory | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ date: '', story: '', quote: '' });
  
  // Import state
  const [importErrors, setImportErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [importPreview, setImportPreview] = useState<DailyStory[]>([]);

  const loadStories = useCallback(async () => {
    try {
      setLoading(true);
      const allStories = await fantasMiaDB.getAllDailyStories();
      // Sort by date (parse month name)
      const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
        'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      allStories.sort((a, b) => {
        const [dayA, monthA] = a.date.split(' ');
        const [dayB, monthB] = b.date.split(' ');
        const monthIdxA = MONTHS.indexOf(monthA.toLowerCase());
        const monthIdxB = MONTHS.indexOf(monthB.toLowerCase());
        if (monthIdxA !== monthIdxB) return monthIdxA - monthIdxB;
        return parseInt(dayA) - parseInt(dayB);
      });
      setStories(allStories);
    } catch (error) {
      console.error('Error loading daily stories:', error);
      toast({ title: 'Errore', description: 'Impossibile caricare i racconti', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleCreate = () => {
    setEditingStory(null);
    setFormData({ date: '', story: '', quote: '' });
    setIsFormDialogOpen(true);
  };

  const handleEdit = (story: DailyStory) => {
    setEditingStory(story);
    setFormData({ date: story.date, story: story.story, quote: story.quote });
    setIsFormDialogOpen(true);
  };

  const handleView = (story: DailyStory) => {
    setViewingStory(story);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (story: DailyStory) => {
    if (!confirm(`Eliminare il racconto del ${story.date}?`)) return;
    
    try {
      await fantasMiaDB.deleteDailyStory(story.date);
      toast({ title: 'Eliminato', description: `Racconto del ${story.date} eliminato` });
      loadStories();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    const errors = validateDailyStory(formData);
    if (errors.length > 0) {
      toast({ title: 'Errore di validazione', description: errors.join(', '), variant: 'destructive' });
      return;
    }
    
    try {
      // If editing and date changed, delete old entry
      if (editingStory && editingStory.date !== formData.date) {
        await fantasMiaDB.deleteDailyStory(editingStory.date);
      }
      
      await fantasMiaDB.saveDailyStory(formData as DailyStory);
      toast({ title: 'Salvato', description: `Racconto del ${formData.date} salvato` });
      setIsFormDialogOpen(false);
      loadStories();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare', variant: 'destructive' });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const content = await file.text();
      const result = parseDailyStoriesFile(content);
      
      setImportErrors(result.errors);
      setImportPreview(result.stories);
      setIsImportDialogOpen(true);
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile leggere il file', variant: 'destructive' });
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) {
      toast({ title: 'Nessun racconto', description: 'Nessun racconto valido da importare', variant: 'destructive' });
      return;
    }
    
    try {
      const count = await fantasMiaDB.importDailyStories(importPreview);
      toast({ title: 'Importazione completata', description: `${count} racconti importati` });
      setIsImportDialogOpen(false);
      setImportErrors([]);
      setImportPreview([]);
      loadStories();
    } catch (error) {
      toast({ title: 'Errore', description: 'Importazione fallita', variant: 'destructive' });
    }
  };

  // 🛡️ SECURITY: Spinner durante check autorizzazione
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <StoryLayout
      title="Gestione Racconti del Giorno"
      subtitle="Importa e gestisci i racconti quotidiani"
      onBack={() => navigate('/superuser')}
    >
      <div className="space-y-6">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Racconto
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importa da File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Stories table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Racconti ({stories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Caricamento...</div>
            ) : stories.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nessun racconto. Importa un file o creane uno nuovo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Data</TableHead>
                      <TableHead>Anteprima racconto</TableHead>
                      <TableHead>Massima</TableHead>
                      <TableHead className="w-32 text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stories.map((story) => (
                      <TableRow key={story.date}>
                        <TableCell className="font-medium">{story.date}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {story.story.substring(0, 60)}...
                        </TableCell>
                        <TableCell className="max-w-xs truncate italic">
                          "{story.quote.substring(0, 40)}..."
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleView(story)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(story)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(story)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStory ? `Modifica racconto: ${editingStory.date}` : 'Nuovo racconto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data (es. "12 dicembre")</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="12 dicembre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story">Racconto</Label>
              <Textarea
                id="story"
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="C'era una volta..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote">Massima del giorno</Label>
              <Input
                id="quote"
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="La lentezza vince la gara"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Racconto del {viewingStory?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{viewingStory?.story}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="italic text-amber-800">"{viewingStory?.quote}"</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importazione file</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Errori trovati ({importErrors.length})</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>Riga {err.line}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {importPreview.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  Racconti validi da importare ({importPreview.length})
                </h4>
                <ul className="text-sm text-green-700 space-y-1 max-h-48 overflow-y-auto">
                  {importPreview.map((story, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-medium">{story.date}:</span>
                      <span className="truncate">{story.story.substring(0, 50)}...</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={handleImportConfirm} 
              disabled={importPreview.length === 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Importa {importPreview.length} racconti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StoryLayout>
  );
};

export default SuperuserDailyStoriesManagement;
