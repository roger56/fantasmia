import React, { useState } from 'react';
import { Info, Volume2, VolumeX } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface StoryModeTooltipProps {
  text: string;
  modeId: string;
}

const StoryModeTooltip: React.FC<StoryModeTooltipProps> = ({ text, modeId }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking on tooltip trigger
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={handleTooltipClick}
          className="absolute left-2 top-2 w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors z-10"
          aria-label="Informazioni sulla modalità"
        >
          <Info className="w-3 h-3 text-blue-600" />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        className="max-w-[250px] p-3 bg-white border border-slate-200 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-slate-700 mb-2 leading-relaxed">{text}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSpeak}
          className="w-full h-8 text-xs flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3 h-3" />
              Ferma lettura
            </>
          ) : (
            <>
              <Volume2 className="w-3 h-3" />
              Ascolta spiegazione
            </>
          )}
        </Button>
      </TooltipContent>
    </Tooltip>
  );
};

export default StoryModeTooltip;
