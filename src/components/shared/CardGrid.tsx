import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CardItem {
  id: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  name?: string;
}

interface CardGridProps<T extends CardItem> {
  cards: T[];
  onCardSelect: (card: T) => void;
  selectedCards?: Set<number>;
  disabledCards?: Set<number>;
  columns?: {
    sm: number;
    md: number;
    lg: number;
    xl?: number;
  };
  cardHeight?: string;
  renderCard?: (card: T, isSelected: boolean, isDisabled: boolean) => React.ReactNode;
  showTooltips?: boolean;
}

const CardGrid = <T extends CardItem>({
  cards,
  onCardSelect,
  selectedCards = new Set(),
  disabledCards = new Set(),
  columns = { sm: 2, md: 3, lg: 4 },
  cardHeight = "h-32",
  renderCard,
  showTooltips = true
}: CardGridProps<T>) => {
  const getGridClasses = () => {
    const baseClass = "grid gap-4";
    const colClasses = [
      `grid-cols-${columns.sm}`,
      `md:grid-cols-${columns.md}`,
      `lg:grid-cols-${columns.lg}`
    ];
    
    if (columns.xl) {
      colClasses.push(`xl:grid-cols-${columns.xl}`);
    }
    
    return `${baseClass} ${colClasses.join(' ')}`;
  };

  const defaultRenderCard = (card: T, isSelected: boolean, isDisabled: boolean) => (
    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
      {card.icon && (
        <div className="text-2xl mb-2">
          {card.icon}
        </div>
      )}
      <div className="text-center">
        <span className="text-xs font-medium text-slate-600">#{card.id}</span>
        <p className="text-sm font-medium text-slate-800 mt-1 leading-tight">
          {card.name || card.title}
        </p>
      </div>
    </CardContent>
  );

  const CardComponent = ({ card }: { card: T }) => {
    const isSelected = selectedCards.has(card.id);
    const isDisabled = disabledCards.has(card.id);
    
    const handleClick = () => {
      if (!isDisabled && !isSelected) {
        onCardSelect(card);
      }
    };

    const cardContent = (
      <Card 
        className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-md ${cardHeight} ${
          isSelected 
            ? 'bg-slate-200 border-slate-400 opacity-50' 
            : isDisabled
            ? 'bg-slate-100 border-slate-300 opacity-30 cursor-not-allowed'
            : 'hover:border-slate-300 hover:scale-105'
        }`}
        onClick={handleClick}
      >
        {renderCard ? renderCard(card, isSelected, isDisabled) : defaultRenderCard(card, isSelected, isDisabled)}
      </Card>
    );

    if (!showTooltips) {
      return cardContent;
    }

    return (
      <Tooltip key={card.id}>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{card.title}</p>
            <p className="text-sm">{card.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <div className={getGridClasses()}>
        {cards.map((card) => (
          <CardComponent key={card.id} card={card} />
        ))}
      </div>
    </TooltipProvider>
  );
};

export default CardGrid;