import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Palette, Loader2, Download, Bug, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CopyrightWarningDialog from './CopyrightWarningDialog';

interface MediaButtonProps {
    storyContent: string;
    storyTitle?: string;
    storyId?: string;
    className?: string;
    userId?: string;
}

const MediaButton: React.FC<MediaButtonProps> = ({
    storyContent,
    storyTitle,
    storyId,
    className = "",
    userId
}) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [userComment, setUserComment] = useState('');
    const [showCommentDialog, setShowCommentDialog] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [showAuthWarning, setShowAuthWarning] = useState(false);
    const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Reset state when story changes
    useEffect(() => {
        console.log('MediaButton: Story changed, resetting state');
        setUserComment('');
        setDebugInfo(null);
        setGeneratedImage(null);
        setShowImageDialog(false);
    }, [storyContent, storyId]);

    // Check debug mode
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location && window.location.pathname) {
            setIsDebugMode(window.location.pathname.includes('superuser'));
        }
    }, []);

    const handleMediaAction = async (type: string, subtype: string) => {
        if (type === 'Disegno') {
            setSelectedStyle(subtype.toLowerCase());
            setShowCopyrightWarning(true);
        } else {
            toast({
                title: "Funzione in sviluppo",
                description: `${type} - ${subtype} sarà presto disponibile`,
                variant: "default"
            });
        }
    };

    const handleGenerateWithComment = async () => {
        setShowCommentDialog(false);
        await handleImageGeneration(selectedStyle);
    };

    const handleCopyrightProceed = () => {
        setShowCopyrightWarning(false);
        setShowCommentDialog(true);
    };

    const handleImageGeneration = async (style: string) => {
        // Prevent multiple requests
        if (isGenerating) {
            console.log('⚠️ Already generating, skipping...');
            return;
        }

        if (!storyContent || storyContent.trim().length === 0) {
            toast({
                title: "Errore",
                description: "Nessun contenuto della storia disponibile",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);

        try {
            console.log('🚀 Starting image generation for style:', style);

            const enhancedPrompt = userComment
                ? `${storyContent}\nNote aggiuntive: ${userComment}`
                : storyContent;

            const response = await fetch('https://fantasmia-ai.vercel.app/api/openai/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    style: style
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data?.image_url) {
                setGeneratedImage(data.image_url);
                setShowImageDialog(true);
                setUserComment('');

                toast({
                    title: "🎉 Immagine generata!",
                    description: "Immagine creata con successo",
                    variant: "default"
                });
            } else {
                throw new Error('Nessuna URL immagine nella risposta');
            }
        } catch (error: any) {
            console.error('❌ Image generation error:', error);
            
            if (error.message.includes('Billing hard limit')) {
                toast({
                    title: "❌ Credito esaurito",
                    description: "Il servizio immagini è temporaneamente non disponibile per limite di credito OpenAI.",
                    variant: "destructive"
                });
            } else if (error.name === 'AbortError') {
                console.log('⚠️ Request cancelled by user');
            } else {
                toast({
                    title: "❌ Errore",
                    description: error.message || "Errore nella generazione dell'immagine",
                    variant: "destructive"
                });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!generatedImage) return;
        
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${storyTitle || 'immagine'}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast({
                title: "✅ Download completato",
                description: "L'immagine è stata scaricata sul tuo dispositivo",
                variant: "default"
            });
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: "❌ Errore nel download",
                description: "Non è stato possibile scaricare l'immagine.",
                variant: "destructive"
            });
        }
    };

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <DropdownMenu>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className={`px-6 ${className}`} disabled={isGenerating}>
                                    {isGenerating ? ( 
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Palette className="w-4 h-4 mr-2" />
                                    )}
                                    {isGenerating ? 'Generando...' : 'MEDIA'}
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Genera immagini AI per la tua storia</p>
                        </TooltipContent>
                        <DropdownMenuContent className="w-56 bg-white border shadow-lg z-50">
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer">
                                    Disegno
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="bg-white border shadow-lg">
                                    {['Fumetto', 'Fotografico', 'Astratto', 'Manga', 'Acquarello', 'Carboncino'].map((style) => (
                                        <DropdownMenuItem
                                            key={style}
                                            className="cursor-pointer"
                                            onClick={() => handleMediaAction('Disegno', style)}
                                            disabled={isGenerating}
                                        >
                                            {style}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Tooltip>
            </TooltipProvider>

            {/* Copyright Warning Dialog */}
            <CopyrightWarningDialog
                open={showCopyrightWarning}
                onOpenChange={setShowCopyrightWarning}
                onConfirm={handleCopyrightProceed}
                selectedStyle={selectedStyle}
            />

            {/* Comment Dialog */}
            <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                <DialogContent className="max-w-md" aria-describedby="comment-dialog-description">
                    <DialogHeader>
                        <DialogTitle>Aggiungi un commento (opzionale)</DialogTitle>
                    </DialogHeader>
                    <DialogDescription id="comment-dialog-description">
                        Personalizza l'immagine aggiungendo specifiche o dettagli desiderati.
                    </DialogDescription>
                    <div className="space-y-4">
                        <Textarea
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            placeholder="es. 'in stile fiabesco', 'con ambientazione spaziale', 'con colori vivaci..."
                            className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowCommentDialog(false)}
                            >
                                Annulla
                            </Button>
                            <Button onClick={handleGenerateWithComment} disabled={isGenerating}>
                                {isGenerating ? 'Generando...' : 'Genera Immagine'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Display Dialog */}
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}> 
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto" aria-describedby="image-dialog-description">
                    <DialogHeader>
                        <DialogTitle>Immagine Generata - {storyTitle}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription id="image-dialog-description">
                        Visualizza l'immagine generata per la storia. Puoi scaricarla sul tuo dispositivo.
                    </DialogDescription>
                    {generatedImage ? (
                        <div className="flex flex-col items-center space-y-4">
                            <img
                                src={generatedImage}
                                alt="Immagine generata per la storia"
                                className="max-w-full h-auto rounded-lg shadow-lg"
                            />
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handleDownloadImage}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Scarica Immagine
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MediaButton;