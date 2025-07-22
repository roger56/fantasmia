import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import { GamePhase, ProppCard, StoryPhase } from '@/types/propp';
import ProppWarningScreen from '@/components/propp/ProppWarningScreen';
import ProppCardSelectionScreen from '@/components/propp/ProppCardSelectionScreen';
import ProppWritingScreen from '@/components/propp/ProppWritingScreen';
import ProppFreeWritingScreen from '@/components/propp/ProppFreeWritingScreen';
import ProppFinalScreen from '@/components/propp/ProppFinalScreen';

const ProppEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory, mode = 'serial' } = location.state || {};

  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('warning');
  const [currentCluster, setCurrentCluster] = useState(1);
  const [selectedCard, setSelectedCard] = useState<ProppCard | null>(null);
  const [storyPhases, setStoryPhases] = useState<StoryPhase[]>([]);
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [finalStory, setFinalStory] = useState('');
  
  // Free mode state
  const [usedCards, setUsedCards] = useState<number[]>([]);
  const [freeStoryText, setFreeStoryText] = useState('');

  const handleCardSelect = (card: ProppCard) => {
    setSelectedCard(card);
    setGamePhase('writing');
  };

  const handleContinueParagraph = () => {
    if (!currentParagraph.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Inserisci un paragrafo per continuare",
        variant: "destructive"
      });
      return;
    }

    // Save current phase
    const newPhase: StoryPhase = {
      card: selectedCard,
      content: currentParagraph
    };
    
    const updatedPhases = [...storyPhases, newPhase];
    setStoryPhases(updatedPhases);
    
    // Update final story
    const story = updatedPhases.map(phase => phase.content).join('\n\n');
    setFinalStory(story);
    
    // Clear current paragraph
    setCurrentParagraph('');
    
    // Move to next cluster or finish
    if (currentCluster < 9) {
      setCurrentCluster(currentCluster + 1);
      setSelectedCard(null);
      setGamePhase('card-selection');
    } else {
      setGamePhase('final');
    }
  };

  const handleBack = () => {
    if (storyPhases.length > 0) {
      const lastPhase = storyPhases[storyPhases.length - 1];
      setCurrentParagraph(lastPhase.content);
      setSelectedCard(lastPhase.card);
      setStoryPhases(storyPhases.slice(0, -1));
      setCurrentCluster(currentCluster - 1);
      setGamePhase('writing');
    }
  };

  const handleExit = () => {
    const hasContent = mode === 'free' 
      ? (freeStoryText.trim() || currentParagraph.trim())
      : (storyPhases.length > 0 || currentParagraph.trim());
      
    if (hasContent) {
      if (confirm("Sei sicuro di voler uscire? Tutte le modifiche andranno perse.")) {
        navigate('/propp-mode-selector', { state: { profileId, profileName } });
      }
    } else {
      navigate('/propp-mode-selector', { state: { profileId, profileName } });
    }
  };

  const handleSuspend = () => {
    // TODO: Implement story suspension
    toast({
      title: "Funzione non ancora disponibile",
      description: "La sospensione delle storie sarà disponibile presto",
    });
  };

  const handleStartGame = () => {
    if (mode === 'free') {
      setGamePhase('free-writing');
    } else {
      setGamePhase('card-selection');
    }
  };

  // Free mode handlers
  const handleFreeCardSelect = (card: ProppCard) => {
    setSelectedCard(card);
    setUsedCards([...usedCards, card.id]);
  };

  const handleFreeCardChange = () => {
    if (selectedCard) {
      // Remove the current selected card from used cards
      setUsedCards(usedCards.filter(id => id !== selectedCard.id));
      setSelectedCard(null);
    }
  };

  const handleFinishStory = () => {
    setFinalStory(freeStoryText);
    setGamePhase('final');
  };

  const handleFreeSave = () => {
    // TODO: Implement free mode save functionality
    toast({
      title: "Funzione non ancora disponibile",
      description: "Il salvataggio per la modalità carte libere sarà disponibile presto",
    });
  };

  const handleSave = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per salvare la storia",
        variant: "destructive"
      });
      return;
    }

    const story = {
      id: editStory ? editStory.id : Date.now().toString(),
      title: storyTitle,
      content: finalStory,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: mode === 'free' ? 'PROPP_FREE' as const : 'PROPP' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      answers: storyPhases.map(phase => phase.content),
      language: 'italian' as const
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/propp-mode-selector', { state: { profileId, profileName } }), 1500);
  };

  // Render appropriate screen based on game phase
  switch (gamePhase) {
    case 'warning':
      return (
        <ProppWarningScreen 
          onExit={handleExit}
          onStart={handleStartGame}
        />
      );

    case 'card-selection':
      return (
        <ProppCardSelectionScreen
          currentCluster={currentCluster}
          onCardSelect={handleCardSelect}
          onExit={handleExit}
          onSuspend={handleSuspend}
          onBack={handleBack}
          canGoBack={storyPhases.length > 0}
        />
      );

    case 'writing':
      return (
        <ProppWritingScreen
          currentCluster={currentCluster}
          selectedCard={selectedCard}
          storyPhases={storyPhases}
          currentParagraph={currentParagraph}
          onParagraphChange={setCurrentParagraph}
          onContinue={handleContinueParagraph}
          onBack={handleBack}
          onExit={handleExit}
          onSuspend={handleSuspend}
          canGoBack={storyPhases.length > 0}
          isLastCluster={currentCluster === 9}
        />
      );

    case 'free-writing':
      return (
        <ProppFreeWritingScreen
          selectedCard={selectedCard}
          usedCards={usedCards}
          storyText={freeStoryText}
          currentParagraph={currentParagraph}
          onStoryTextChange={setFreeStoryText}
          onCurrentParagraphChange={setCurrentParagraph}
          onCardSelect={handleFreeCardSelect}
          onCardChange={handleFreeCardChange}
          onFinishStory={handleFinishStory}
          onSuspend={handleSuspend}
          onSave={handleFreeSave}
          onExit={handleExit}
        />
      );

    case 'final':
      return (
        <ProppFinalScreen
          storyTitle={storyTitle}
          finalStory={finalStory}
          onTitleChange={setStoryTitle}
          onStoryChange={setFinalStory}
          onSave={handleSave}
          profileId={profileId}
          profileName={profileName}
        />
      );

    default:
      return null;
  }
};

export default ProppEditor;