/**
 * Componente principale "Conosci la parola?"
 * Combina l'icona animata e l'overlay
 */

import React from 'react';
import { useConosciLaParola } from '@/hooks/useConosciLaParola';
import ConosciLaParolaIcon from './ConosciLaParolaIcon';
import ConosciLaParolaOverlay from './ConosciLaParolaOverlay';

const ConosciLaParola: React.FC = () => {
  const {
    showIcon,
    currentWord,
    showOverlay,
    showDefinition,
    iconPosition,
    handleIconClick,
    handleYes,
    handleNo,
    closeOverlay
  } = useConosciLaParola();

  // Don't render if no word loaded
  if (!currentWord) {
    return null;
  }

  return (
    <>
      {/* Animated Icon */}
      {showIcon && (
        <ConosciLaParolaIcon
          position={iconPosition}
          onClick={handleIconClick}
        />
      )}
      
      {/* Quiz Overlay */}
      <ConosciLaParolaOverlay
        isOpen={showOverlay}
        word={currentWord.word}
        definition={currentWord.definition}
        showDefinition={showDefinition}
        onYes={handleYes}
        onNo={handleNo}
        onClose={closeOverlay}
      />
    </>
  );
};

export default ConosciLaParola;
