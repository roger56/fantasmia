import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileText, Home, Pause } from 'lucide-react';
import { ProppCard, StoryPhase } from '@/types/propp';
import WritingCard from '@/components/shared/WritingCard';

interface ProppWritingScreenProps {
  currentCluster: number;
  selectedCard: ProppCard | null;
  storyPhases: StoryPhase[];
  currentParagraph: string;
  onParagraphChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onExit: () => void;
  onSuspend: () => void;
  canGoBack: boolean;
  isLastCluster: boolean;
}

const ProppWritingScreen: React.FC<ProppWritingScreenProps> = ({
  currentCluster,
  selectedCard,
  storyPhases,
  currentParagraph,
  onParagraphChange,
  onContinue,
  onBack,
  onExit,
  onSuspend,
  canGoBack,
  isLastCluster
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800">Scrivi il Paragrafo</h1>
            <p className="text-sm text-slate-600">Cluster {currentCluster}/9</p>
          </div>
          <Button variant="outline" onClick={onSuspend}>
            <Pause className="w-4 h-4 mr-2" />
            Sospendi
          </Button>
        </div>

        {/* Current card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-3xl">{selectedCard?.icon}</div>
              <div>
                <CardTitle className="text-blue-800">{selectedCard?.title}</CardTitle>
                <p className="text-slate-600">{selectedCard?.description}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Story so far */}
        {storyPhases.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">La tua storia fino a ora:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {storyPhases.map((phase, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{phase.card?.icon}</span>
                      <span className="font-medium text-slate-700">{phase.card?.title}</span>
                    </div>
                    <p className="text-slate-800 text-sm">{phase.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Writing area */}
        <WritingCard
          title="Scrivi il nuovo paragrafo"
          subtitle="Massimo 10 righe suggerite"
          value={currentParagraph}
          onChange={onParagraphChange}
          placeholder="Scrivi qui il paragrafo per questa carta..."
          maxLines={10}
          onSpeechResult={(text) => onParagraphChange(currentParagraph + (currentParagraph ? ' ' : '') + text)}
        />

        {/* Navigation */}
        <div className="flex gap-3 justify-center">
          <Button onClick={onExit} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          {canGoBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          )}
          <Button 
            onClick={onContinue} 
            disabled={!currentParagraph.trim()}
            className="px-8"
          >
            {isLastCluster ? (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Fine Storia
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Continua
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProppWritingScreen;