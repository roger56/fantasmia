import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, ExternalLink, Book } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface RecommendedBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyTitle: string;
  isSuperuser?: boolean;
}

interface BookLink {
  id: string;
  url: string;
  title: string;
}

const RecommendedBooksDialog: React.FC<RecommendedBooksDialogProps> = ({
  open,
  onOpenChange,
  storyId,
  storyTitle,
  isSuperuser = false
}) => {
  const [books, setBooks] = useState<BookLink[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBookUrl, setNewBookUrl] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const { toast } = useToast();

  // Initialize books with default links and placeholders
  useEffect(() => {
    const defaultBooks: BookLink[] = [
      {
        id: '1',
        url: 'https://www.amazon.it/libri-italiano/b/?ie=UTF8&node=411663031&ref_=nav_cs_books',
        title: 'Libri Amazon Italia'
      }
    ];

    // Add placeholder entries A through O
    const alphabet = 'ABCDEFGHIJKLMNO';
    for (let i = 1; i < alphabet.length; i++) {
      defaultBooks.push({
        id: (i + 1).toString(),
        url: '',
        title: `Placeholder ${alphabet[i]}`
      });
    }

    setBooks(defaultBooks);
  }, []);

  const handleAddBook = () => {
    if (!newBookUrl.trim() || !newBookTitle.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci sia l'URL che il titolo del libro",
        variant: "destructive"
      });
      return;
    }

    const newBook: BookLink = {
      id: Date.now().toString(),
      url: newBookUrl.trim(),
      title: newBookTitle.trim()
    };

    setBooks(prev => [...prev, newBook]);
    setNewBookUrl('');
    setNewBookTitle('');
    setShowAddForm(false);
    
    toast({
      title: "Libro aggiunto",
      description: "Il link è stato aggiunto con successo"
    });
  };

  const handleDeleteBook = (id: string) => {
    setBooks(prev => prev.filter(book => book.id !== id));
    toast({
      title: "Libro rimosso",
      description: "Il link è stato rimosso con successo"
    });
  };

  const handleOpenLink = (url: string) => {
    if (url.trim()) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              Libri Consigliati - {storyTitle}
            </DialogTitle>
          </DialogHeader>

          {isSuperuser && (
            <div className="flex justify-end">
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Link
              </Button>
            </div>
          )}

          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {books.map((book) => (
                <div key={book.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{book.title}</div>
                    {book.url && (
                      <div className="text-sm text-muted-foreground truncate">
                        {book.url}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {book.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLink(book.url)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Apri
                      </Button>
                    )}
                    
                    {isSuperuser && book.id !== '1' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                            <AlertDialogDescription>
                              Vuoi rimuovere questo libro consigliato?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBook(book.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Rimuovi
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-xs text-muted-foreground">
            💡 Qui trovi libri che raccontano meglio del tuo eroe
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Book Form Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Libro Consigliato</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="book-title">Titolo del libro</Label>
              <Input
                id="book-title"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Inserisci il titolo del libro..."
              />
            </div>
            
            <div>
              <Label htmlFor="book-url">URL del libro</Label>
              <Input
                id="book-url"
                value={newBookUrl}
                onChange={(e) => setNewBookUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddBook}>
              Aggiungi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecommendedBooksDialog;