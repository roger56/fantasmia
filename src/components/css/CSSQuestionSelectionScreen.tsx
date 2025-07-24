import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Dice6, Edit3 } from 'lucide-react';
import { cssThemes } from '@/data/cssThemes';
import { CSSTheme } from '@/types/css';
import HomeButton from '@/components/HomeButton';

interface CSSQuestionSelectionScreenProps {
  onQuestionSelect: (question: string) => void;
  onExit: () => void;
}

const CSSQuestionSelectionScreen: React.FC<CSSQuestionSelectionScreenProps> = ({
  onQuestionSelect,
  onExit
}) => {
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<CSSTheme | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleThemeSelect = (theme: CSSTheme) => {
    setSelectedTheme(theme);
    setShowCustomInput(false);
  };

  const handleQuestionSelect = (question: string) => {
    onQuestionSelect(question);
  };

  const handleCustomQuestionSubmit = () => {
    if (customQuestion.trim()) {
      let formattedQuestion = customQuestion.trim();
      if (!formattedQuestion.toLowerCase().startsWith('cosa succede se')) {
        formattedQuestion = `Cosa succede se ${formattedQuestion.toLowerCase()}?`;
      }
      onQuestionSelect(formattedQuestion);
    }
  };

  const getRandomQuestions = (theme: CSSTheme) => {
    const shuffled = [...theme.questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onExit} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">
              Cosa succede se...?
            </h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Custom Question */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit3 className="w-5 h-5 mr-2" />
                Scrivi la tua domanda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm">
                Inventa una domanda "Cosa succede se...?" personalizzata
              </p>
              <Textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Esempio: i gatti imparano a leggere"
                className="min-h-[80px]"
                style={{ minHeight: '80px' }}
              />
              <Button 
                onClick={handleCustomQuestionSubmit}
                disabled={!customQuestion.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Inizia con questa domanda
              </Button>
            </CardContent>
          </Card>

          {/* Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dice6 className="w-5 h-5 mr-2" />
                Scegli un tema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-4">
                Seleziona un tema per vedere domande casuali
              </p>
              <div className="space-y-2">
                {cssThemes.map((theme) => (
                  <Button
                    key={theme.id}
                    variant={selectedTheme?.id === theme.id ? "default" : "outline"}
                    onClick={() => handleThemeSelect(theme)}
                    className="w-full justify-start"
                  >
                    {theme.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Random Questions */}
        {selectedTheme && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Domande dal tema "{selectedTheme.name}"</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {getRandomQuestions(selectedTheme).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuestionSelect(question)}
                    className="text-left justify-start h-auto p-4"
                  >
                    {question}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => handleThemeSelect(selectedTheme)}
                className="w-full mt-4"
              >
                <Dice6 className="w-4 h-4 mr-2" />
                Altre domande casuali
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CSSQuestionSelectionScreen;