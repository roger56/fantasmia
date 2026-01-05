import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { 
  addCustomWordIT, 
  addCustomWordEN, 
  getCustomWordsIT, 
  getCustomWordsEN, 
  deleteCustomWordIT, 
  deleteCustomWordEN,
  WordEntryIT,
  WordEntryEN 
} from '@/utils/customWordsManager';

const WORDGAME_SETTINGS_KEY = 'fantasmia_wordgame_settings';

interface WordGameSettings {
  enabled: boolean;
  startDelay: number;
  animationDuration: number;
  speed: number;
  languageIT: boolean;
  languageEN: boolean;
}

const defaultSettings: WordGameSettings = {
  enabled: true,
  startDelay: 120,
  animationDuration: 20,
  speed: 5,
  languageIT: true,
  languageEN: true
};

const SuperuserButterflySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [wordGameSettings, setWordGameSettings] = useState<WordGameSettings>(defaultSettings);
  const [customWordsIT, setCustomWordsIT] = useState<WordEntryIT[]>([]);
  const [customWordsEN, setCustomWordsEN] = useState<WordEntryEN[]>([]);
  const [newWordIT, setNewWordIT] = useState({ word: '', definition: '' });
  const [newWordEN, setNewWordEN] = useState({ word: '', meaningEN: '', meaningIT: '', translationIT: '' });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORDGAME_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setWordGameSettings({
          enabled: parsed.enabled !== false,
          startDelay: parsed.startDelay || 120,
          animationDuration: parsed.animationDuration || 20,
          speed: parsed.speed || 5,
          languageIT: parsed.languageIT !== false,
          languageEN: parsed.languageEN !== false
        });
      }
    } catch (e) {
      console.warn('Error loading word game settings', e);
    }
    
    loadCustomWords();
  }, []);
  
  const loadCustomWords = async () => {
    try {
      const wordsIT = await getCustomWordsIT();
      const wordsEN = await getCustomWordsEN();
      setCustomWordsIT(wordsIT);
      setCustomWordsEN(wordsEN);
    } catch (e) {
      console.warn('Error loading custom words', e);
    }
  };

  const handleSaveWordGameSettings = () => {
    try {
      localStorage.setItem(WORDGAME_SETTINGS_KEY, JSON.stringify(wordGameSettings));
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni della farfalla sono state aggiornate",
      });
    } catch (e) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive"
      });
    }
  };
  
  const handleAddWordIT = async () => {
    if (!newWordIT.word.trim() || !newWordIT.definition.trim()) {
      toast({ title: "Compila tutti i campi", variant: "destructive" });
      return;
    }
    
    try {
      await addCustomWordIT({ 
        word: newWordIT.word.trim().toUpperCase(), 
        definition: newWordIT.definition.trim() 
      });
      setNewWordIT({ word: '', definition: '' });
      await loadCustomWords();
      toast({ title: "Parola italiana aggiunta" });
    } catch (e) {
      toast({ title: "Errore nell'aggiungere la parola", variant: "destructive" });
    }
  };
  
  const handleAddWordEN = async () => {
    if (!newWordEN.word.trim() || !newWordEN.meaningEN.trim() || !newWordEN.meaningIT.trim() || !newWordEN.translationIT.trim()) {
      toast({ title: "Compila tutti i campi", variant: "destructive" });
      return;
    }
    
    try {
      await addCustomWordEN({
        word: newWordEN.word.trim().toUpperCase(),
        meaningEN: newWordEN.meaningEN.trim(),
        meaningIT: newWordEN.meaningIT.trim(),
        translationIT: newWordEN.translationIT.trim().toUpperCase()
      });
      setNewWordEN({ word: '', meaningEN: '', meaningIT: '', translationIT: '' });
      await loadCustomWords();
      toast({ title: "Parola inglese aggiunta" });
    } catch (e) {
      toast({ title: "Errore nell'aggiungere la parola", variant: "destructive" });
    }
  };
  
  const handleDeleteWordIT = async (word: string) => {
    try {
      await deleteCustomWordIT(word);
      await loadCustomWords();
      toast({ title: "Parola eliminata" });
    } catch (e) {
      toast({ title: "Errore nell'eliminare la parola", variant: "destructive" });
    }
  };
  
  const handleDeleteWordEN = async (word: string) => {
    try {
      await deleteCustomWordEN(word);
      await loadCustomWords();
      toast({ title: "Parola eliminata" });
    } catch (e) {
      toast({ title: "Errore nell'eliminare la parola", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser-settings')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Conosci la Parola (Farfalla)
              </h1>
              <p className="text-slate-600">Configura timing, velocità e gestisci parole</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Impostazioni</TabsTrigger>
                <TabsTrigger value="words">Gestione Parole</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-6 mt-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Abilita funzione</Label>
                    <p className="text-xs text-slate-500">Mostra la farfalla agli utenti NSU</p>
                  </div>
                  <Switch
                    checked={wordGameSettings.enabled}
                    onCheckedChange={(checked) => setWordGameSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                
                {/* Languages */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🇮🇹</span>
                      <Label>Italiano attivo</Label>
                    </div>
                    <Switch
                      checked={wordGameSettings.languageIT}
                      onCheckedChange={(checked) => setWordGameSettings(prev => ({ ...prev, languageIT: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🇬🇧</span>
                      <Label>Inglese attivo</Label>
                    </div>
                    <Switch
                      checked={wordGameSettings.languageEN}
                      onCheckedChange={(checked) => setWordGameSettings(prev => ({ ...prev, languageEN: checked }))}
                    />
                  </div>
                </div>
                
                {/* Timing */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="startDelay">Ritardo apparizione (secondi)</Label>
                    <Input
                      id="startDelay"
                      type="number"
                      min={5}
                      max={600}
                      value={wordGameSettings.startDelay}
                      onChange={(e) => setWordGameSettings(prev => ({
                        ...prev,
                        startDelay: parseInt(e.target.value) || 120
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Tempo prima che appaia la farfalla (5-600s)</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="animationDuration">Durata animazione (secondi)</Label>
                    <Input
                      id="animationDuration"
                      type="number"
                      min={5}
                      max={120}
                      value={wordGameSettings.animationDuration}
                      onChange={(e) => setWordGameSettings(prev => ({
                        ...prev,
                        animationDuration: parseInt(e.target.value) || 20
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Quanto rimane visibile la farfalla (5-120s)</p>
                  </div>
                </div>
                
                {/* Speed */}
                <div>
                  <Label>Velocità farfalla: {wordGameSettings.speed}</Label>
                  <Slider
                    value={[wordGameSettings.speed]}
                    onValueChange={(value) => setWordGameSettings(prev => ({ ...prev, speed: value[0] }))}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">1 = lento, 10 = veloce (override del calcolo basato su età)</p>
                </div>
                
                <Button onClick={handleSaveWordGameSettings} className="w-full">
                  Salva impostazioni
                </Button>
              </TabsContent>
              
              <TabsContent value="words" className="space-y-6 mt-4">
                <Tabs defaultValue="it">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="it">🇮🇹 Italiano</TabsTrigger>
                    <TabsTrigger value="en">🇬🇧 Inglese</TabsTrigger>
                  </TabsList>
                  
                  {/* Italian Words */}
                  <TabsContent value="it" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Input
                        placeholder="Parola (es. CORAGGIO)"
                        value={newWordIT.word}
                        onChange={(e) => setNewWordIT(prev => ({ ...prev, word: e.target.value }))}
                      />
                      <Input
                        placeholder="Definizione"
                        value={newWordIT.definition}
                        onChange={(e) => setNewWordIT(prev => ({ ...prev, definition: e.target.value }))}
                      />
                      <Button onClick={handleAddWordIT} size="sm" className="gap-1">
                        <Plus className="w-4 h-4" /> Aggiungi
                      </Button>
                    </div>
                    
                    {customWordsIT.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-sm font-medium text-slate-600">Parole personalizzate ({customWordsIT.length}):</p>
                        {customWordsIT.map((w) => (
                          <div key={w.word} className="flex items-center justify-between bg-background p-2 rounded">
                            <div>
                              <span className="font-medium">{w.word}</span>
                              <span className="text-muted-foreground text-sm ml-2">- {w.definition}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteWordIT(w.word)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* English Words */}
                  <TabsContent value="en" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Input
                        placeholder="Parola inglese (es. BRAVE)"
                        value={newWordEN.word}
                        onChange={(e) => setNewWordEN(prev => ({ ...prev, word: e.target.value }))}
                      />
                      <Input
                        placeholder="Significato in inglese"
                        value={newWordEN.meaningEN}
                        onChange={(e) => setNewWordEN(prev => ({ ...prev, meaningEN: e.target.value }))}
                      />
                      <Input
                        placeholder="Significato in italiano"
                        value={newWordEN.meaningIT}
                        onChange={(e) => setNewWordEN(prev => ({ ...prev, meaningIT: e.target.value }))}
                      />
                      <Input
                        placeholder="Traduzione italiana (es. CORAGGIOSO)"
                        value={newWordEN.translationIT}
                        onChange={(e) => setNewWordEN(prev => ({ ...prev, translationIT: e.target.value }))}
                      />
                      <Button onClick={handleAddWordEN} size="sm" className="gap-1">
                        <Plus className="w-4 h-4" /> Aggiungi
                      </Button>
                    </div>
                    
                    {customWordsEN.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-sm font-medium text-slate-600">Parole personalizzate ({customWordsEN.length}):</p>
                        {customWordsEN.map((w) => (
                          <div key={w.word} className="flex items-center justify-between bg-background p-2 rounded">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{w.word}</span>
                              <span className="text-primary text-sm ml-2">→ {w.translationIT}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteWordEN(w.word)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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
      </div>
    </div>
  );
};

export default SuperuserButterflySettings;
