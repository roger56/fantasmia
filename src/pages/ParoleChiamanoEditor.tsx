import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Home, Mic, MicOff, Volume2, Check, RotateCcw, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

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
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [speechState, setSpeechState] = useState<{ isPlaying: boolean, utterance?: SpeechSynthesisUtterance }>({ isPlaying: false });
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalStory, setOriginalStory] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

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

  // Check for used words in story
  const checkUsedWords = (text: string) => {
    if (!selectedSeries) return;
    const chosenWords = wordSeries[selectedSeries];
    const used = chosenWords.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
    setUsedWords(used);
  };

  // Check if all words are used
  const allWordsUsed = () => {
    if (!selectedSeries) return false;
    const chosenWords = wordSeries[selectedSeries];
    return chosenWords.every(word => 
      usedWords.some(usedWord => usedWord.toLowerCase() === word.toLowerCase())
    );
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
      
      // Check for used words in the complete story so far
      const completeStory = newBlocks.join('\n');
      checkUsedWords(completeStory);
    }
  };

  const handleFinishStory = () => {
    const completeStory = storyBlocks.join('\n');
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
      if (speechState.isPlaying) {
        speechSynthesis.pause();
        setSpeechState(prev => ({ ...prev, isPlaying: false }));
      } else if (speechSynthesis.paused && speechState.utterance) {
        speechSynthesis.resume();
        setSpeechState(prev => ({ ...prev, isPlaying: true }));
      } else {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'it-IT';
        
        utterance.onend = () => {
          setSpeechState({ isPlaying: false });
        };
        
        setSpeechState({ isPlaying: true, utterance });
        speechSynthesis.speak(utterance);
      }
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    
    try {
      if (!isTranslated) {
        // Translate to English
        setOriginalStory(finalStory);
        
        const translatedStory = await translateToEnglish(finalStory);
        setFinalStory(translatedStory);
        setIsTranslated(true);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata tradotta in inglese",
        });
      } else {
        // Return to Italian
        setFinalStory(originalStory);
        setIsTranslated(false);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata riportata in italiano",
        });
      }
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre la storia",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveStory = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per la storia",
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
      title: "Storia salvata!",
      description: "La tua storia è stata salvata nell'archivio",
    });

    navigate('/superuser-archive', { state: { profileId, profileName } });
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Una Parola, Tante Storie</h1>
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
                    onClick={() => handleSeriesChoice(seriesKey)}
                    className="w-full mt-4"
                    variant="default"
                  >
                    Usa Serie {seriesKey}
                  </Button>
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
            <Button variant="ghost" onClick={() => setStep('series')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Crea la tua Storia</h1>
            <div></div>
          </div>

          {/* Guiding sentence with word highlighting */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="text-lg font-semibold text-center text-slate-800">
                {selectedSeries && wordSeries[selectedSeries].map((word, index) => (
                  <span 
                    key={index}
                    className={`mr-2 px-2 py-1 rounded ${
                      usedWords.some(usedWord => usedWord.toLowerCase() === word.toLowerCase())
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Story so far */}
          {storyBlocks.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Storia fino a qui:</CardTitle>
              </CardHeader>
              <CardContent className="max-h-32 overflow-y-auto">
                <div className="text-slate-700 whitespace-pre-wrap text-sm">
                  {storyBlocks.join('\n')}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current block editor */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Continua la tua storia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentBlockText}
                onChange={(e) => setCurrentBlockText(e.target.value)}
                placeholder="Scrivi il prossimo pezzo della tua storia..."
                className="min-h-[80px] resize-none"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <div className="flex flex-col sm:flex-row gap-3">
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
                  Aggiungi alla Storia
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={handleFinishStory}
              disabled={storyBlocks.length === 0 || !allWordsUsed()}
              size="lg"
            >
              Fine Storia
            </Button>
            {storyBlocks.length > 0 && !allWordsUsed() && (
              <p className="text-sm text-orange-600 mt-2">
                Usa tutte le parole per concludere: {selectedSeries && wordSeries[selectedSeries].filter(word => 
                  !usedWords.some(usedWord => usedWord.toLowerCase() === word.toLowerCase())
                ).join(', ')}
              </p>
            )}
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
            <h1 className="text-2xl font-bold text-slate-800 ml-4">La tua Storia - {profileName}</h1>
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
                className="resize-none"
                style={{ height: 'auto', minHeight: '200px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 400) + 'px';
                }}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Input
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Titolo della storia..."
                  className="flex-1"
                />
                <Button onClick={handleSaveStory} disabled={!storyTitle.trim() || missingWords.length > 0}>
                  <Check className="w-4 h-4 mr-2" />
                  Salva
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleTranslate} 
              variant="outline" 
              disabled={isTranslating || !finalStory.trim()}
              className="flex-1"
            >
              <Globe className="w-4 h-4 mr-2" />
              {isTranslating ? 'Traduzione...' : (isTranslated ? 'ITALIANO' : 'INGLESE')}
            </Button>
            
            <Button 
              onClick={() => handleTextToSpeech(finalStory)}
              variant="outline"
              className="flex-1"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              ASCOLTA
            </Button>
            
            <Button 
              onClick={() => navigate('/superuser-archive', { state: { profileId, profileName } })}
              variant="outline"
              className="flex-1"
            >
              Archivio
            </Button>
            
            <Button 
              onClick={() => navigate('/create-story', { state: { profileId, profileName } })}
              variant="outline"
              className="flex-1"
            >
              Nuova Storia
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ParoleChiamanoEditor;