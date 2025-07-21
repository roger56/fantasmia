import React from 'react';
import { ProppCard } from '@/types/propp';
import { Card, CardContent } from '@/components/ui/card';
import { proppClusters } from '@/data/proppCards';

interface ProppFreeCardGridProps {
  usedCards: number[];
  onCardSelect: (card: ProppCard) => void;
}

const ProppFreeCardGrid: React.FC<ProppFreeCardGridProps> = ({ usedCards, onCardSelect }) => {
  // Get all cards from all clusters
  const allCards = Object.values(proppClusters).flat();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
      {allCards.map((card) => {
        const isUsed = usedCards.includes(card.id);
        
        return (
          <Card
            key={card.id}
            className={`cursor-pointer transition-all duration-200 h-24 ${
              isUsed 
                ? 'opacity-50 bg-gray-100 cursor-not-allowed' 
                : 'hover:shadow-md hover:scale-105 border-2 hover:border-blue-300'
            }`}
            onClick={() => !isUsed && onCardSelect(card)}
          >
            <CardContent className="p-2 h-full flex flex-col items-center justify-center">
              <div className={`text-2xl mb-1 ${isUsed ? 'grayscale' : ''}`}>
                {card.icon}
              </div>
              <p className={`text-xs text-center font-medium leading-tight ${
                isUsed ? 'text-gray-400' : 'text-slate-700'
              }`}>
                {card.name}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProppFreeCardGrid;