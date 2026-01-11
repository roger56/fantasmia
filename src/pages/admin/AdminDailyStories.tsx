import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { fantasMiaDB } from '@/utils/indexedDB';
import { parseDailyStoriesFile, validateDailyStory, type DailyStory } from '@/utils/dailyStoryParser';
import { useToast } from '@/hooks/use-toast';

const AdminDailyStories = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stories, setStories] = useState<DailyStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<DailyStory | null>(null);
  const [viewingStory, setViewingStory] = useState<DailyStory | null>(null);
  const [formData, setFormData] = useState({ date: '', story: '', quote: '' });
  const [importErrors, setImportErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [importPreview, setImportPreview] = useState<DailyStory[]>([]);

  const loadStories = useCallback(async () => {
    try {
      setLoading(true);
      const allStories = await fantasMiaDB.getAllDailyStories();
      const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
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
      toast({ title: 'Errore', description: 'Impossibile caricare i racconti', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadStories(); }, [loadStories]);

  const handleCreate = () => { setEditingStory(null); setFormData({ date: '', story: '', quote: '' }); setIsFormDialogOpen(true); };
  const handleEdit = (story: DailyStory) => { setEditingStory(story); setFormData({ date: story.date, story: story.story, quote: story.quote }); setIsFormDialogOpen(true); };
  const handleView = (story: DailyStory) => { setViewingStory(story); setIsViewDialogOpen(true); };
  const handleDelete = async (story: DailyStory) => { if (!confirm(`Eliminare il racconto del ${story.date}?`)) return; await fantasMiaDB.deleteDailyStory(story.date); toast({ title: 'Eliminato' }); loadStories(); };

  const handleSave = async () => {
    const errors = validateDailyStory(formData);
    if (errors.length > 0) { toast({ title: 'Errore', description: errors.join(', '), variant: 'destructive' }); return; }
    if (editingStory && editingStory.date !== formData.date) await fantasMiaDB.deleteDailyStory(editingStory.date);
    await fantasMiaDB.saveDailyStory(formData as DailyStory);
    toast({ title: 'Salvato' });
    setIsFormDialogOpen(false);
    loadStories();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const result = parseDailyStoriesFile(content);
    setImportErrors(result.errors);
    setImportPreview(result.stories);
    setIsImportDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) return;
    const count = await fantasMiaDB.importDailyStories(importPreview);
    toast({ title: 'Importazione completata', description: `${count} racconti importati` });
    setIsImportDialogOpen(false);
    loadStories();
  };

  return (
    <AdminLayout title="Gestione Racconti del Giorno" subtitle="Importa e gestisci i racconti quotidiani">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Nuovo Racconto</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-emerald-300 text-emerald-700"><Upload className="w-4 h-4 mr-2" />Importa da File</Button>
          <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={handleFileSelect} className="hidden" />
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-600" />Racconti ({stories.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-center py-8">Caricamento...</div> : stories.length === 0 ? <div className="text-center py-8">Nessun racconto.</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Anteprima</TableHead><TableHead>Massima</TableHead><TableHead className="text-right">Azioni</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stories.map((story) => (
                    <TableRow key={story.date}>
                      <TableCell className="font-medium">{story.date}</TableCell>
                      <TableCell className="max-w-xs truncate">{story.story.substring(0, 60)}...</TableCell>
                      <TableCell className="max-w-xs truncate italic">"{story.quote.substring(0, 40)}..."</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleView(story)}><Eye className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(story)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(story)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingStory ? `Modifica: ${editingStory.date}` : 'Nuovo racconto'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Data (es. "12 dicembre")</Label><Input value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
            <div><Label>Racconto</Label><Textarea value={formData.story} onChange={(e) => setFormData({ ...formData, story: e.target.value })} rows={6} /></div>
            <div><Label>Massima del giorno</Label><Input value={formData.quote} onChange={(e) => setFormData({ ...formData, quote: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Annulla</Button><Button onClick={handleSave} className="bg-emerald-600">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Racconto del {viewingStory?.date}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><div className="bg-slate-50 rounded-lg p-4"><p className="whitespace-pre-wrap">{viewingStory?.story}</p></div><div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="italic text-emerald-800">"{viewingStory?.quote}"</p></div></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Importazione file</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {importErrors.length > 0 && <div className="bg-red-50 p-4 rounded"><h4 className="font-medium text-red-800">Errori ({importErrors.length})</h4></div>}
            {importPreview.length > 0 && <div className="bg-green-50 p-4 rounded"><h4 className="font-medium text-green-800">Validi ({importPreview.length})</h4></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Annulla</Button><Button onClick={handleImportConfirm} disabled={importPreview.length === 0} className="bg-emerald-600">Importa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDailyStories;
