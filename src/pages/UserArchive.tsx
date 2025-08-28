import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ArrowLeft, BookOpen, Volume2, Eye, Image, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStoriesForUser, getUserByName, deleteStory, hasStoryImages } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import HomeButton from '@/components/HomeButton';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AuthBridge } from '@/utils/authBridge';

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

const UserArchive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [stories, setStories] = useState<StoryWithMedia[]>([]);
  const [filteredStories, setFilteredStories] = useState<StoryWithMedia[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedStory, setSelectedStory] = useState<TableRow | null>(null);
  const [currentScreen, setCurrentScreen] = useState<1 | 2>(1);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const checkAuthAndLoadStories = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }

      if (authStatus.userName === 'superuser') {
        // Superuser should go to superuser archive instead
        navigate('/superuser-archive');
        return;
      }

      setCurrentUser(authStatus.userName || '');
      loadUserStories(authStatus.userName || '');
    };

    checkAuthAndLoadStories();
  }, [navigate]);

  const loadUserStories = async (userName: string) => {
    try {
      // Get user by name to find userId
      const user = getUserByName(userName);
      if (!user) {
        console.error('User not found:', userName);
        setStories([]);
        return;
      }
      
      // Get stories from user's personal archive
      const userStories = await getStoriesForUser(user.id);
      const storiesWithMedia: StoryWithMedia[] = userStories.map(story => ({
        id: story.id,
        title: story.title,
        content: story.content || '',
        authorName: story.authorName,
        lastModified: story.lastModified,
        mode: story.mode,
        status: story.status,
        mediaGenerations: []
      }));
      setStories(storiesWithMedia);
    } catch (error) {
      console.error('Error fetching user stories:', error);
      setStories([]);
    }
  };

  useEffect(() => {
    let filtered = stories;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.mode === selectedCategory);
    }
    
    setFilteredStories(filtered);

    // Create table rows
    const rows: TableRow[] = [];
    
    filtered.forEach(story => {
      rows.push({
        storyId: story.id,
        storyTitle: story.title,
        author: story.authorName,
        date: new Date(story.lastModified).toLocaleDateString('it-IT'),
        cost: 0
      });
    });

    setTableRows(rows);
  }, [selectedCategory, stories]);

  const [speechState, setSpeechState] = useState<{[key: string]: {playing: boolean, paused: boolean, utterance?: SpeechSynthesisUtterance}}>({});

  const handleTextToSpeech = (content: string, storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('speechSynthesis' in window) {
      const currentState = speechState[storyId];
      
      if (currentState?.playing && !currentState.paused) {
        speechSynthesis.pause();
        setSpeechState(prev => ({
          ...prev,
          [storyId]: { ...prev[storyId], paused: true }
        }));
      } else if (currentState?.playing && currentState.paused) {
        speechSynthesis.resume();
        setSpeechState(prev => ({
          ...prev,
          [storyId]: { ...prev[storyId], paused: false }
        }));
      } else {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'it-IT';
        
        utterance.onstart = () => {
          setSpeechState(prev => ({
            ...prev,
            [storyId]: { playing: true, paused: false, utterance }
          }));
        };
        
        utterance.onend = () => {
          setSpeechState(prev => ({
            ...prev,
            [storyId]: { playing: false, paused: false }
          }));
        };
        
        utterance.onerror = () => {
          setSpeechState(prev => ({
            ...prev,
            [storyId]: { playing: false, paused: false }
          }));
        };
        
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
      const deleted = deleteStory(storyId);
      
      if (deleted) {
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
    { value: 'CSS', label: 'Cosa Succede se...' },
    { value: 'PROFESSION', label: 'Cosa farei se...' }
  ];

  // Mobile Card Component for first screen
  const MobileStoryCard = ({ row, index }: { row: TableRow; index: number }) => (
    <Card 
      key={`${row.storyId}-${index}`} 
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedStory(row);
        setCurrentScreen(1);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate" title={row.storyTitle}>
              {row.storyTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {row.date}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/story/${row.storyId}`);
              }}
              title="Visualizza storia"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Elimina storia"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => e.stopPropagation()}
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
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Mobile Detail Drawer Component
  const MobileDetailDrawer = () => {
    if (!selectedStory) return null;

    const story = stories.find(s => s.id === selectedStory.storyId);

    return (
      <Drawer open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg truncate pr-4" title={selectedStory.storyTitle}>
                {selectedStory.storyTitle}
              </DrawerTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentScreen(currentScreen === 1 ? 2 : 1)}
                  className="text-primary"
                >
                  {currentScreen === 1 ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-6 pb-6 space-y-4">
            {currentScreen === 1 ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Titolo Storia</h4>
                  <p className="text-base">{selectedStory.storyTitle}</p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/story/${selectedStory.storyId}`)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizza
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      if (story) {
                        handleTextToSpeech(story.content, selectedStory.storyId, e);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Leggi
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Scorri a destra per vedere i dettagli →
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Titolo Storia</h4>
                  <p className="text-base">{selectedStory.storyTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Data</h4>
                    <p className="text-sm">{selectedStory.date}</p>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    ← Scorri a sinistra per tornare alle azioni
                  </p>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <ProfileIndicator />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Le Tue Storie</h1>
              <p className="text-slate-600">Le storie che hai creato</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className={`${isMobile ? 'space-y-4' : 'flex items-center gap-4 flex-wrap'}`}>
                <div className={`${isMobile ? 'w-full' : 'flex items-center gap-2'}`}>
                  <label className="text-sm font-medium text-slate-700">
                    Filtra per categoria:
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={isMobile ? 'w-full mt-2' : 'w-48'}>
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
                </div>

                <div className="text-sm text-slate-600">
                  <strong>{tableRows.length}</strong> {tableRows.length === 1 ? 'storia trovata' : 'storie trovate'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Archivio Personale
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tableRows.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">Nessuna storia trovata</p>
                <p className="text-sm text-slate-500">Inizia a creare le tue storie dal dashboard!</p>
              </div>
            ) : isMobile ? (
              <div className="space-y-4">
                {tableRows.map((row, index) => (
                  <MobileStoryCard key={`${row.storyId}-${index}`} row={row} index={index} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row, index) => (
                    <TableRow key={`${row.storyId}-${index}`}>
                      <TableCell className="font-medium">{row.storyTitle}</TableCell>
                      <TableCell>{row.date}</TableCell>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Elimina storia"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                                  className="bg-destructive hover:bg-destructive/90"
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
            )}
          </CardContent>
        </Card>

        {isMobile && <MobileDetailDrawer />}
      </div>
    </div>
  );
};

export default UserArchive;