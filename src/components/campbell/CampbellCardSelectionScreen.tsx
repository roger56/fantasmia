import React from 'react';
import { Button } from '@/components/ui/button';
import { CampbellCard } from '@/types/campbell';
import { campbellCards } from '@/data/campbellCards';
import CampbellCardIcon from './CampbellCardIcon';
import StoryLayout from '@/components/shared/StoryLayout';
import StoryDisplayCard from '@/components/shared/StoryDisplayCard';
import CardGrid from '@/components/shared/CardGrid';

interface CampbellCardSelectionScreenProps {
  selectedCards: Set<number>;
  onCardSelect: (card: CampbellCard) => void;
  onExit: () => void;
  onFinish: () => void;
  storyContent: string;
}

const CampbellCardSelectionScreen: React.FC<CampbellCardSelectionScreenProps> = ({
  selectedCards,
  onCardSelect,
  onExit,
  onFinish,
  storyContent
}) => {
  const canFinish = selectedCards.size >= 6;
  const remainingCards = campbellCards.filter(card => !selectedCards.has(card.id));

  const renderCampbellCard = (card: CampbellCard, isSelected: boolean) => (
    <div className="p-4 flex flex-col items-center justify-center h-full">
      <CampbellCardIcon cardId={card.id} className="w-10 h-10 mb-2" />
      <div className="text-center">
        <span className="text-xs font-medium text-slate-600">#{card.id}</span>
        <p className="text-sm font-medium text-slate-800 mt-1 leading-tight">
          {card.title}
        </p>
      </div>
    </div>
  );

  return (
    <StoryLayout
      title="Carte di Campbell"
      subtitle={`Carte usate: ${selectedCards.size}/12 • Rimangono: ${remainingCards.length}`}
      onBack={onExit}
      headerContent={
        canFinish ? (
          <Button 
            onClick={onFinish}
            className="bg-green-600 hover:bg-green-700"
          >
            FINE STORIA
          </Button>
        ) : null
      }
    >
      <StoryDisplayCard
        title="La tua storia finora:"
        content={storyContent}
        maxHeight="max-h-32"
      />

      <CardGrid
        cards={campbellCards}
        onCardSelect={onCardSelect}
        selectedCards={selectedCards}
        columns={{ sm: 2, md: 3, lg: 4 }}
        renderCard={renderCampbellCard}
      />

      {!canFinish && (
        <div className="mt-6 text-center">
          <p className="text-slate-600">
            Devi completare almeno 6 carte per finire la storia
          </p>
        </div>
      )}
    </StoryLayout>
  );
};

export default CampbellCardSelectionScreen;