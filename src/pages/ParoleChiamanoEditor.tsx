import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Home, Mic, MicOff, Volume2, Check, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

interface WordSeries {
  A: string[];
  B: string[];
  C: string[];
}

const ParoleChiamanoEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName } = location.state || {};

  const [step, setStep] = useState<'intro' | 'input' | 'series' | 'choose' | 'story' | 'final'>('intro');
  const [inputWord, setInputWord] = useState('');
  const [wordSeries, setWordSeries] = useState<WordSeries>({ A: [], B: [], C: [] });
  const [selectedSeries, setSelectedSeries] = useState<'A' | 'B' | 'C' | null>(null);
  const [storyBlocks, setStoryBlocks] = useState<string[]>([]);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [currentBlockText, setCurrentBlockText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [finalStory, setFinalStory] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [missingWords, setMissingWords] = useState<string[]>([]);
  const [guidingSentence, setGuidingSentence] = useState('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'it-IT';
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentBlockText(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };
      
      rec.onerror = () => {
        setIsRecording(false);
        toast({
          title: "Errore",
          description: "Errore nel riconoscimento vocale",
          variant: "destructive"
        });
      };
      
      setRecognition(rec);
    }
  }, [toast]);

  const generateWordSeries = (word: string): WordSeries => {
    const letters = word.toLowerCase().split('');
    
    // Sample word lists for each letter - in a real app these would be more comprehensive
    const wordBank: {[key: string]: string[]} = {
      'a': ['allegro', 'ampio', 'attivo', 'antico', 'azzurro'],
      'b': ['bello', 'bravo', 'brillante', 'buono', 'bianco'],
      'c': ['carino', 'calmo', 'coraggioso', 'curioso', 'colorato'],
      'd': ['dolce', 'divertente', 'delicato', 'dinamico', 'denso'],
      'e': ['elegante', 'energico', 'emozionante', 'enorme', 'esperto'],
      'f': ['felice', 'forte', 'fantastico', 'furbo', 'fresco'],
      'g': ['grande', 'gentile', 'gioioso', 'generoso', 'giovane'],
      'h': ['alto', 'onesto', 'umile', 'intelligente', 'interessante'],
      'i': ['incredibile', 'intelligente', 'importante', 'immenso', 'impaziente'],
      'j': ['gioviale', 'gentile', 'gioioso', 'giusto', 'generoso'],
      'k': ['carino', 'calmo', 'coraggioso', 'curioso', 'colorato'],
      'l': ['luminoso', 'leggero', 'lungo', 'libero', 'liscio'],
      'm': ['magico', 'morbido', 'magnifico', 'misterioso', 'moderno'],
      'n': ['nuovo', 'naturale', 'nero', 'nervoso', 'normale'],
      'o': ['originale', 'ordinato', 'ottimo', 'onesto', 'oggettivo'],
      'p': ['piccolo', 'perfetto', 'pulito', 'profondo', 'paziente'],
      'q': ['quieto', 'qualsiasi', 'quotidiano', 'qualificato', 'quarto'],
      'r': ['rosso', 'rapido', 'ricco', 'robusto', 'rilassato'],
      's': ['speciale', 'semplice', 'sicuro', 'silenzioso', 'splendido'],
      't': ['tranquillo', 'tenero', 'tremendamente', 'tropicale', 'trasparente'],
      'u': ['ultimo', 'unico', 'utile', 'urbano', 'unito'],
      'v': ['veloce', 'verde', 'vero', 'vivace', 'vuoto'],
      'w': ['ottimo', 'originale', 'onesto', 'oggettivo', 'ordinato'],
      'x': ['speciale', 'semplice', 'sicuro', 'silenzioso', 'splendido'],
      'y': ['giovane', 'gioioso', 'generoso', 'gentile', 'grande'],
      'z': ['zitto', 'zelante', 'zero', 'zona', 'zucchero']
    };

    const generateSeries = () => {
      return letters.map(letter => {
        const availableWords = wordBank[letter] || ['parola'];
        return availableWords[Math.floor(Math.random() * availableWords.length)];
      });
    };

    return {
      A: generateSeries(),
      B: generateSeries(),
      C: generateSeries()
    };
  };

  const handleWordInput = () => {
    if (inputWord.length >= 4 && inputWord.length <= 6) {
      const series = generateWordSeries(inputWord);
      setWordSeries(series);
      setStep('series');
    } else {
      toast({
        title: "Parola non valida",
        description: "La parola deve avere tra 4 e 6 lettere",
        variant: "destructive"
      });
    }
  };

  const handleSeriesChoice = (series: 'A' | 'B' | 'C') => {
    setSelectedSeries(series);
    const chosenWords = wordSeries[series];
    setGuidingSentence(chosenWords.join(' - '));
    setStep('story');
  };

  const handleRegenerateSeries = () => {
    const series = generateWordSeries(inputWord);
    setWordSeries(series);
  };

  const replaceWordInSeries = (index: number, newWord: string, series: 'A' | 'B' | 'C') => {
    const letter = inputWord[index].toLowerCase();
    if (newWord.toLowerCase().startsWith(letter)) {
      setWordSeries(prev => ({
        ...prev,
        [series]: prev[series].map((word, i) => i === index ? newWord : word)
      }));
    } else {
      toast({
        title: "Lettera non corretta",
        description: `La parola deve iniziare con "${inputWord[index].toUpperCase()}"`,
        variant: "destructive"
      });
    }
  };

  const handleAddBlock = () => {
    if (currentBlockText.trim()) {
      const newBlocks = [...storyBlocks, currentBlockText.trim()];
      setStoryBlocks(newBlocks);
      setCurrentBlockText('');
      
      if (currentBlock < 8) {
        setCurrentBlock(currentBlock + 1);
      }
    }
  };

  const handleFinishStory = () => {
    const completeStory = storyBlocks.join('\n\n');
    setFinalStory(completeStory);
    
    // Check if all words from selected series are used
    if (selectedSeries) {
      const usedWords = wordSeries[selectedSeries];
      const missing = usedWords.filter(word => 
        !completeStory.toLowerCase().includes(word.toLowerCase())
      );
      setMissingWords(missing);
    }
    
    setStep('final');
  };

  const handleSpeechRecognition = () => {
    if (!recognition) {
      toast({
        title: "Non supportato",
        description: "Il riconoscimento vocale non è supportato",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      speechSynthesis.speak(utterance);
    }
  };

  const handleSaveStory = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per la favola",
        variant: "destructive"
      });
      return;
    }

    if (missingWords.length > 0) {
      toast({
        title: "Parole mancanti",
        description: `Inserisci tutte le parole: ${missingWords.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const story = {
      id: Date.now().toString(),
      title: storyTitle,
      content: finalStory,
      status: 'completed' as const,
      lastModified: new Date().toLocaleDateString(),
      mode: 'PAROLE_CHIAMANO' as const,
      authorId: profileId,
      authorName: profileName,
      isPublic: false
    };

    saveStory(story);
    
    toast({
      title: "Favola salvata!",
      description: "La tua favola è stata salvata nell'archivio",
    });

    navigate('/archive', { state: { profileId, profileName } });
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Parole Chiamano</h1>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-slate-700 mb-6">
                Partendo da una parola di quattro–sei lettere, il servizio genera tre serie di parole chiave 
                (aggettivi, verbi o avverbi) corrispondenti alle iniziali delle lettere che compongono la parola 
                che hai inserito, lasciando a te la scelta finale.
              </p>
              <Button onClick={() => setStep('input')} size="lg">
                Inizia
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => setStep('intro')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Inserisci una Parola</h1>
          </div>
          
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                <label className="block text-lg font-medium text-slate-700">
                  Scrivi una parola di 4-6 lettere:
                </label>
                <Input
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder="Esempio: CASA"
                  className="text-lg text-center"
                  maxLength={6}
                />
                <div className="text-center">
                  <Button 
                    onClick={handleWordInput}
                    disabled={inputWord.length < 4 || inputWord.length > 6}
                    size="lg"
                  >
                    Avanti
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'series') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setStep('input')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Serie Parole per: {inputWord.toUpperCase()}</h1>
            <Button variant="outline" onClick={handleRegenerateSeries}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {(['A', 'B', 'C'] as const).map((seriesKey) => (
              <Card key={seriesKey} className="border-2">
                <CardHeader>
                  <CardTitle className="text-center">Serie {seriesKey}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wordSeries[seriesKey].map((word, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-mono text-lg w-6">{inputWord[index].toUpperCase()}:</span>
                        <Input
                          value={word}
                          onChange={(e) => replaceWordInSeries(index, e.target.value, seriesKey)}
                          className="text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => setStep('choose')}
                    className="w-full mt-4"
                    variant={selectedSeries === seriesKey ? "default" : "outline"}
                  >
                    Scegli Serie {seriesKey}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => setStep('series')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Scegli una Serie</h1>
          </div>
          
          <div className="grid gap-4">
            {(['A', 'B', 'C'] as const).map((seriesKey) => (
              <Card key={seriesKey} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6" onClick={() => handleSeriesChoice(seriesKey)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Serie {seriesKey}</h3>
                      <p className="text-slate-600">{wordSeries[seriesKey].join(' - ')}</p>
                    </div>
                    <Button>Usa questa serie</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'story') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setStep('choose')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Crea la tua Storia</h1>
            <div></div>
          </div>

          {/* Guiding sentence */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-lg font-semibold text-center text-slate-800">
                {guidingSentence}
              </p>
            </CardContent>
          </Card>

          {/* Story so far */}
          {storyBlocks.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Storia fino a qui:</CardTitle>
              </CardHeader>
              <CardContent className="max-h-40 overflow-y-auto">
                <div className="text-slate-700 whitespace-pre-wrap">
                  {storyBlocks.join('\n\n')}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current block editor */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Blocco {currentBlock + 1} di 9</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentBlockText}
                onChange={(e) => setCurrentBlockText(e.target.value)}
                placeholder="Scrivi il prossimo pezzo della tua storia..."
                className="min-h-32 resize-none"
                rows={4}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSpeechRecognition}
                  variant="outline"
                  className="flex-1"
                >
                  {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isRecording ? 'Ferma' : 'Registra'}
                </Button>
                <Button
                  onClick={handleAddBlock}
                  disabled={!currentBlockText.trim()}
                  className="flex-1"
                >
                  Aggiungi Blocco
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={handleFinishStory}
              disabled={storyBlocks.length === 0}
              size="lg"
            >
              Fine Storia
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">La tua Favola</h1>
          </div>

          {missingWords.length > 0 && (
            <Card className="mb-4 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <p className="text-orange-800">
                  <strong>Parole mancanti:</strong> {missingWords.join(', ')}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  Modifica il testo per includerle tutte prima di salvare.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardContent className="p-6">
              <Textarea
                value={finalStory}
                onChange={(e) => setFinalStory(e.target.value)}
                className="min-h-96 resize-none"
                rows={20}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Input
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Titolo della favola..."
                  className="flex-1"
                />
                <Button onClick={handleSaveStory} disabled={!storyTitle.trim() || missingWords.length > 0}>
                  <Check className="w-4 h-4 mr-2" />
                  Salva
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => handleTextToSpeech(finalStory)}
              variant="outline"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              TTS
            </Button>
            <Button 
              onClick={() => navigate('/archive', { state: { profileId, profileName } })}
              variant="outline"
            >
              Archivio
            </Button>
            <Button 
              onClick={() => navigate('/create-story', { state: { profileId, profileName } })}
              variant="outline"
            >
              Nuova Favola
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ParoleChiamanoEditor;