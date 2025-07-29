import React from 'react';
import IntroductionScreen from '@/components/shared/IntroductionScreen';

interface CampbellWarningScreenProps {
  onContinue: () => void;
  onExit: () => void;
}

const CampbellWarningScreen: React.FC<CampbellWarningScreenProps> = ({
  onContinue,
  onExit
}) => {
  const description = (
    <div className="space-y-4">
      <p className="text-slate-700 leading-relaxed">
        Benvenuto nel <strong>Viaggio dell'Eroe</strong>! 
      </p>
      <p className="text-slate-700 leading-relaxed">
        Seguendo le 12 tappe del famoso schema di Joseph Campbell, 
        potrai creare una storia personale dove il protagonista affronta 
        sfide, incontra alleati e nemici, e torna trasformato dalla sua avventura.
      </p>
      <p className="text-slate-700 leading-relaxed">
        Ogni carta rappresenta una tappa importante del viaggio. 
        Puoi seguire l'ordine suggerito o saltare alcune carte, 
        ma ricorda: ogni grande eroe ha una storia da raccontare!
      </p>
    </div>
  );

  return (
    <IntroductionScreen
      title="Carte di Campbell"
      subtitle="Il Viaggio dell'Eroe"
      description={description}
      onContinue={onContinue}
      onExit={onExit}
      continueButtonText="Inizia il viaggio"
    />
  );
};

export default CampbellWarningScreen;