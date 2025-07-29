import React from 'react';
import { HelpCircle } from 'lucide-react';
import IntroductionScreen from '@/components/shared/IntroductionScreen';

interface CSSWarningScreenProps {
  onContinue: () => void;
  onExit: () => void;
}

const CSSWarningScreen: React.FC<CSSWarningScreenProps> = ({ onContinue, onExit }) => {
  const features = [
    'Scegli o scrivi una domanda "Cosa succede se...?"',
    'Rispondi alle domande guida per costruire la storia',
    'Puoi scrivere o usare la voce',
    'Alla fine potrai salvare e condividere la tua storia'
  ];

  return (
    <IntroductionScreen
      title="Cosa succede se...?"
      description={'Benvenuto nella modalità "Cosa succede se...?"! Partirai da una domanda fantastica e costruirai una storia seguendo le domande guida. Usa la tua immaginazione per creare una storia unica e divertente!'}
      onContinue={onContinue}
      onExit={onExit}
      continueButtonText="Inizia l'avventura!"
      backgroundColor="bg-gradient-to-br from-purple-50 to-blue-50"
      showHomeButton={true}
      icon={<HelpCircle className="w-10 h-10 text-purple-600" />}
      features={features}
    />
  );
};

export default CSSWarningScreen;