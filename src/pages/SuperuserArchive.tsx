import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Volume2, Eye, Image, Trash2 } from 'lucide-react';
import { getAllStoriesForSuperuser, deleteStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import HomeButton from '@/components/HomeButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface StoryWithMedia {
  id: string;
  title: string;
  content: string;
  authorName: string;
  lastModified: string;
  mode: string;
  status: string;
  mediaGenerations?: {
    id: string;
    media_url: string;
    media_type: string;
    media_style: string;
    cost: number;
    created_at: string;
  }[];
}

interface TableRow {
  storyId: string;
  storyTitle: string;
  author: string;
  date: string;
  imageUrl?: string;
  imageStyle?: string;
  cost: number;
  mediaId?: string;
}

const SuperuserArchive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<StoryWithMedia[]>([]);
  const [filteredStories, setFilteredStories] = useState<StoryWithMedia[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoriesWithMedia = async () => {
      // Since the database relation doesn't exist yet, use only localStorage for now
      try {
        const localStories = getAllStoriesForSuperuser();
        const allStories: StoryWithMedia[] = localStories.map(story => ({
          id: story.id,
          title: story.title,
          content: story.content || '',
          authorName: story.authorName || 'Utente Sconosciuto',
          lastModified: story.lastModified,
          mode: story.mode,
          status: story.status,
          mediaGenerations: [] // For now, no media from database
        }));
        
        setStories(allStories);
      } catch (error) {
        console.error('Error fetching stories:', error);
        setStories([]);
      }
    };

    fetchStoriesWithMedia();
  }, []);

  useEffect(() => {
    let filtered = stories;
    if (selectedCategory !== 'all') {
      filtered = stories.filter(story => story.mode === selectedCategory);
    }
    setFilteredStories(filtered);

    // Create table rows - one row per story, and separate rows for each image
    const rows: TableRow[] = [];
    
    filtered.forEach(story => {
      const images = story.mediaGenerations?.filter(media => media.media_type === 'image') || [];
      
      if (images.length === 0) {
        // Story without images
        rows.push({
          storyId: story.id,
          storyTitle: story.title,
          author: story.authorName,
          date: new Date(story.lastModified).toLocaleDateString('it-IT'),
          cost: 0
        });
      } else {
        // One row per image
        images.forEach(image => {
          rows.push({
            storyId: story.id,
            storyTitle: story.title,
            author: story.authorName,
            date: new Date(story.lastModified).toLocaleDateString('it-IT'),
            imageUrl: image.media_url,
            imageStyle: image.media_style,
            cost: image.cost,
            mediaId: image.id
          });
        });
      }
    });

    setTableRows(rows);
  }, [selectedCategory, stories]);

  const [speechState, setSpeechState] = useState<{[key: string]: {playing: boolean, utterance?: SpeechSynthesisUtterance}}>({});

  const handleTextToSpeech = (content: string, storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('speechSynthesis' in window) {
      const currentState = speechState[storyId];
      
      if (currentState?.playing) {
        speechSynthesis.cancel();
        setSpeechState(prev => ({
          ...prev,
          [storyId]: { ...prev[storyId], playing: false }
        }));
      } else {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'it-IT';
        
        utterance.onend = () => {
          setSpeechState(prev => ({
            ...prev,
            [storyId]: { ...prev[storyId], playing: false }
          }));
        };
        
        setSpeechState(prev => ({
          ...prev,
          [storyId]: { playing: true, utterance }
        }));
        
        speechSynthesis.speak(utterance);
      }
    } else {
      toast({
        title: "Non supportato",
        description: "La sintesi vocale non è supportata da questo browser",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStory = (storyId: string) => {
    try {
      // Delete the story using the utility function
      const deleted = deleteStory(storyId);
      
      if (deleted) {
        // Remove from local state and update the view
        const updatedStories = stories.filter(story => story.id !== storyId);
        setStories(updatedStories);

        toast({
          title: "Storia eliminata",
          description: "La storia è stata eliminata con successo"
        });
      } else {
        throw new Error('Storia non trovata');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione della storia",
        variant: "destructive"
      });
    }
  };

  const categories = [
    { value: 'all', label: 'Tutte le categorie' },
    { value: 'GHOST', label: 'GHOST' },
    { value: 'PROPP', label: 'PROPP' },
    { value: 'AIROTS', label: 'AIROTS' },
    { value: 'PAROLE_CHIAMANO', label: 'Una Parola, Tante Storie' },
    { value: 'CAMPBELL', label: 'Carte di Campbell' },
    { value: 'CSS', label: 'Cosa Succede se...' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/home')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Archivio Completo</h1>
              <p className="text-slate-600">Tutte le storie degli utenti con media</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">
                  Filtra per categoria:
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600">
                  {tableRows.length} righe trovate
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="sticky top-0 bg-white z-10 border-b">
            <CardTitle>Archivio Completo - {tableRows.length} righe</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tableRows.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Nessuna storia trovata
                </h3>
                <p className="text-slate-600">
                  Non ci sono storie per la categoria selezionata
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[70vh]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="font-semibold">Storia</TableHead>
                      <TableHead className="font-semibold">Autore</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Immagini</TableHead>
                      <TableHead className="font-semibold text-right">Costo (€)</TableHead>
                      <TableHead className="font-semibold">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row, index) => (
                      <TableRow key={`${row.storyId}-${row.mediaId || index}`} className="hover:bg-slate-50">
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate" title={row.storyTitle}>
                            {row.storyTitle}
                          </div>
                        </TableCell>
                        <TableCell>{row.author}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>
                          {row.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <img 
                                src={row.imageUrl} 
                                alt="Anteprima" 
                                className="w-16 h-16 object-cover rounded border"
                              />
                              <div className="text-xs text-slate-600">
                                <Badge variant="outline" className="text-xs">
                                  {row.imageStyle}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Image className="w-4 h-4" />
                              <span className="text-xs">Nessuna immagine</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.cost > 0 ? `€${row.cost.toFixed(3)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/story/${row.storyId}`)}
                              title="Visualizza storia"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                const story = stories.find(s => s.id === row.storyId);
                                if (story) {
                                  handleTextToSpeech(story.content, row.storyId, e);
                                }
                              }}
                              title="Leggi ad alta voce"
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Elimina storia"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare la storia "{row.storyTitle}"? 
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteStory(row.storyId)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </div>
  );
};

export default SuperuserArchive;