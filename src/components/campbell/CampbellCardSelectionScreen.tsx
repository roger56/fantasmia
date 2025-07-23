import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Home as HomeIcon } from 'lucide-react';
import { CampbellCard } from '@/types/campbell';
import { campbellCards } from '@/data/campbellCards';
import { icons } from 'lucide-react';
import HomeButton from '@/components/HomeButton';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-6xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onExit} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Carte di Campbell</h1>
              <p className="text-slate-600">
                Carte usate: {selectedCards.size}/12 • Rimangono: {remainingCards.length}
              </p>
            </div>
          </div>
          {canFinish && (
            <Button 
              onClick={onFinish}
              className="bg-green-600 hover:bg-green-700"
            >
              FINE STORIA
            </Button>
          )}
        </div>

        {/* Story content preview */}
        {storyContent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">La tua storia finora:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-slate-700 whitespace-pre-line">{storyContent}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards grid */}
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {campbellCards.map((card) => {
              const isSelected = selectedCards.has(card.id);
              const IconComponent = icons[card.icon as keyof typeof icons] || HomeIcon;
              
              return (
                <Tooltip key={card.id}>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-md h-32 ${
                        isSelected 
                          ? 'bg-slate-200 border-slate-400 opacity-50' 
                          : 'hover:border-slate-300'
                      }`}
                      onClick={() => !isSelected && onCardSelect(card)}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-medium text-slate-600">#{card.id}</span>
                          <p className="text-sm font-medium text-slate-800 mt-1 leading-tight">
                            {card.title}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{card.title}</p>
                      <p className="text-sm">{card.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {!canFinish && (
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Devi completare almeno 6 carte per finire la storia
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampbellCardSelectionScreen;