import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { addCustomWordIT, addCustomWordEN, getCustomWordsIT, getCustomWordsEN, deleteCustomWordIT, deleteCustomWordEN, WordEntryIT, WordEntryEN } from '@/utils/customWordsManager';

const WORDGAME_SETTINGS_KEY = 'fantasmia_wordgame_settings';

interface WordGameSettings {
  enabled: boolean;
  startDelay: number;
  animationDuration: number;
  speed: number;
  languageIT: boolean;
  languageEN: boolean;
}

const defaultSettings: WordGameSettings = { enabled: true, startDelay: 120, animationDuration: 20, speed: 5, languageIT: true, languageEN: true };

const AdminSystemSettings = () => {
  const { toast } = useToast();
  const [wordGameSettings, setWordGameSettings] = useState<WordGameSettings>(defaultSettings);
  const [customWordsIT, setCustomWordsIT] = useState<WordEntryIT[]>([]);
  const [customWordsEN, setCustomWordsEN] = useState<WordEntryEN[]>([]);
  const [newWordIT, setNewWordIT] = useState({ word: '', definition: '' });
  const [newWordEN, setNewWordEN] = useState({ word: '', meaningEN: '', meaningIT: '', translationIT: '' });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORDGAME_SETTINGS_KEY);
      if (saved) setWordGameSettings(JSON.parse(saved));
    } catch (e) { console.warn('Error loading settings', e); }
    loadCustomWords();
  }, []);

  const loadCustomWords = async () => {
    setCustomWordsIT(await getCustomWordsIT());
    setCustomWordsEN(await getCustomWordsEN());
  };

  const handleSaveSettings = () => {
    localStorage.setItem(WORDGAME_SETTINGS_KEY, JSON.stringify(wordGameSettings));
    toast({ title: 'Impostazioni salvate' });
  };

  const handleAddWordIT = async () => {
    if (!newWordIT.word.trim() || !newWordIT.definition.trim()) return;
    await addCustomWordIT({ word: newWordIT.word.trim().toUpperCase(), definition: newWordIT.definition.trim() });
    setNewWordIT({ word: '', definition: '' });
    await loadCustomWords();
    toast({ title: 'Parola aggiunta' });
  };

  const handleAddWordEN = async () => {
    if (!newWordEN.word.trim() || !newWordEN.meaningEN.trim()) return;
    await addCustomWordEN({ word: newWordEN.word.trim().toUpperCase(), meaningEN: newWordEN.meaningEN.trim(), meaningIT: newWordEN.meaningIT.trim(), translationIT: newWordEN.translationIT.trim().toUpperCase() });
    setNewWordEN({ word: '', meaningEN: '', meaningIT: '', translationIT: '' });
    await loadCustomWords();
    toast({ title: 'Parola aggiunta' });
  };

  return (
    <AdminLayout title="Impostazioni Sistema" subtitle="Farfalla e gestione parole personalizzate">
      <Card className="border-2 border-emerald-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Farfalla "Conosci la Parola"
          </h3>
          
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="settings">Impostazioni</TabsTrigger>
              <TabsTrigger value="words">Gestione Parole</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="flex items-center justify-between">
                <div><Label>Abilita funzione</Label><p className="text-xs text-slate-500">Mostra la farfalla agli utenti NSU</p></div>
                <Switch checked={wordGameSettings.enabled} onCheckedChange={(checked) => setWordGameSettings(prev => ({ ...prev, enabled: checked }))} />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2"><span className="text-2xl">🇮🇹</span><Label>Italiano</Label></div>
                  <Switch checked={wordGameSettings.languageIT} onCheckedChange={(checked) => setWordGameSettings(prev => ({ ...prev, languageIT: checked }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2"><span className="text-2xl">🇬🇧</span><Label>Inglese</Label></div>
                  <Switch checked={wordGameSettings.languageEN} onCheckedChange={(checked) => setWordGameSettings(prev => ({ ...prev, languageEN: checked }))} />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Ritardo apparizione (secondi)</Label>
                  <Input type="number" min={5} max={600} value={wordGameSettings.startDelay} onChange={(e) => setWordGameSettings(prev => ({ ...prev, startDelay: parseInt(e.target.value) || 120 }))} className="mt-1" />
                </div>
                <div>
                  <Label>Durata animazione (secondi)</Label>
                  <Input type="number" min={5} max={120} value={wordGameSettings.animationDuration} onChange={(e) => setWordGameSettings(prev => ({ ...prev, animationDuration: parseInt(e.target.value) || 20 }))} className="mt-1" />
                </div>
              </div>
              
              <div>
                <Label>Velocità farfalla: {wordGameSettings.speed}</Label>
                <Slider value={[wordGameSettings.speed]} onValueChange={(value) => setWordGameSettings(prev => ({ ...prev, speed: value[0] }))} min={1} max={10} step={1} className="mt-2" />
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full bg-emerald-600 hover:bg-emerald-700">Salva impostazioni</Button>
            </TabsContent>
            
            <TabsContent value="words" className="space-y-6">
              <Tabs defaultValue="it">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="it">🇮🇹 Italiano</TabsTrigger>
                  <TabsTrigger value="en">🇬🇧 Inglese</TabsTrigger>
                </TabsList>
                
                <TabsContent value="it" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Input placeholder="Parola (es. CORAGGIO)" value={newWordIT.word} onChange={(e) => setNewWordIT(prev => ({ ...prev, word: e.target.value }))} />
                    <Input placeholder="Definizione" value={newWordIT.definition} onChange={(e) => setNewWordIT(prev => ({ ...prev, definition: e.target.value }))} />
                    <Button onClick={handleAddWordIT} size="sm" className="bg-emerald-600"><Plus className="w-4 h-4 mr-1" />Aggiungi</Button>
                  </div>
                  {customWordsIT.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customWordsIT.map((w) => (
                        <div key={w.word} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div><span className="font-medium">{w.word}</span><span className="text-slate-500 text-sm ml-2">- {w.definition}</span></div>
                          <Button variant="ghost" size="icon" onClick={() => { deleteCustomWordIT(w.word); loadCustomWords(); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Input placeholder="Parola inglese (es. BRAVE)" value={newWordEN.word} onChange={(e) => setNewWordEN(prev => ({ ...prev, word: e.target.value }))} />
                    <Input placeholder="Significato in inglese" value={newWordEN.meaningEN} onChange={(e) => setNewWordEN(prev => ({ ...prev, meaningEN: e.target.value }))} />
                    <Input placeholder="Significato in italiano" value={newWordEN.meaningIT} onChange={(e) => setNewWordEN(prev => ({ ...prev, meaningIT: e.target.value }))} />
                    <Input placeholder="Traduzione (es. CORAGGIOSO)" value={newWordEN.translationIT} onChange={(e) => setNewWordEN(prev => ({ ...prev, translationIT: e.target.value }))} />
                    <Button onClick={handleAddWordEN} size="sm" className="bg-emerald-600"><Plus className="w-4 h-4 mr-1" />Aggiungi</Button>
                  </div>
                  {customWordsEN.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customWordsEN.map((w) => (
                        <div key={w.word} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div><span className="font-medium">{w.word}</span><span className="text-emerald-600 text-sm ml-2">→ {w.translationIT}</span></div>
                          <Button variant="ghost" size="icon" onClick={() => { deleteCustomWordEN(w.word); loadCustomWords(); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSystemSettings;
