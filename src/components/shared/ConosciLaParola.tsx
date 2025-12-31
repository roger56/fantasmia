/**
 * Componente principale "Conosci la parola?"
 * Combina l'icona animata, il selettore lingua e l'overlay
 */

import React from 'react';
import { useConosciLaParola } from '@/hooks/useConosciLaParola';
import ConosciLaParolaIcon from './ConosciLaParolaIcon';
import ConosciLaParolaOverlay from './ConosciLaParolaOverlay';
import ConosciLaParolaLanguageSelector from './ConosciLaParolaLanguageSelector';

const ConosciLaParola: React.FC = () => {
  const {
    showIcon,
    showLanguageSelector,
    showOverlay,
    selectedWord,
    iconPosition,
    activeLanguages,
    handleIconClick,
    handleLanguageSelect,
    closeLanguageSelector,
    closeOverlay
  } = useConosciLaParola();

  return (
    <>
      {/* Animated Icon */}
      {showIcon && (
        <ConosciLaParolaIcon
          position={iconPosition}
          onClick={handleIconClick}
        />
      )}
      
      {/* Language Selector */}
      <ConosciLaParolaLanguageSelector
        isOpen={showLanguageSelector}
        onSelectLanguage={handleLanguageSelect}
        onClose={closeLanguageSelector}
        activeLanguages={activeLanguages}
      />
      
      {/* Quiz Overlay */}
      <ConosciLaParolaOverlay
        isOpen={showOverlay}
        selectedWord={selectedWord}
        onClose={closeOverlay}
      />
    </>
  );
};

export default ConosciLaParola;
