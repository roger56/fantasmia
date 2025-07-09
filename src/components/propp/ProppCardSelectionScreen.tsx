import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, Pause } from 'lucide-react';
import { ProppCard } from '@/types/propp';
import { proppClusters, clusterNames, narrativePhases, getCurrentNarrativePhase } from '@/data/proppCards';

interface ProppCardSelectionScreenProps {
  currentCluster: number;
  onCardSelect: (card: ProppCard) => void;
  onExit: () => void;
  onSuspend: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

const ProppCardSelectionScreen: React.FC<ProppCardSelectionScreenProps> = ({
  currentCluster,
  onCardSelect,
  onExit,
  onSuspend,
  onBack,
  canGoBack
}) => {
  const currentCards = proppClusters[currentCluster] || [];
  const currentPhase = getCurrentNarrativePhase(currentCluster);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800">Estrai Carta</h1>
            <p className="text-sm text-slate-600">Cluster {currentCluster}/9</p>
          </div>
          <Button variant="outline" onClick={onSuspend}>
            <Pause className="w-4 h-4 mr-2" />
            Sospendi
          </Button>
        </div>

        <div className="mb-6">
          <Badge variant="outline" className="mb-2">
            Fase {currentPhase}: {narrativePhases[currentPhase]}
          </Badge>
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-800">
                {clusterNames[currentCluster]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Scegli una carta da questo cluster per continuare la tua favola:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCards.map((card) => (
                  <Card 
                    key={card.id} 
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                    onClick={() => onCardSelect(card)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <h3 className="font-semibold text-slate-800 mb-2">{card.title}</h3>
                      <p className="text-sm text-slate-600">{card.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {canGoBack && (
          <div className="flex justify-center">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Carta Precedente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProppCardSelectionScreen;