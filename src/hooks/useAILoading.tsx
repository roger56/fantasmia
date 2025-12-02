import React, { createContext, useContext, useState, ReactNode } from 'react';
import AILoadingOverlay from '@/components/shared/AILoadingOverlay';

interface AILoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const AILoadingContext = createContext<AILoadingContextType | null>(null);

export const useAILoading = (): AILoadingContextType => {
  const context = useContext(AILoadingContext);
  if (!context) {
    // Return a no-op context if not wrapped in provider (for backwards compatibility)
    return {
      isLoading: false,
      message: '',
      showLoading: () => {},
      hideLoading: () => {}
    };
  }
  return context;
};

interface AILoadingProviderProps {
  children: ReactNode;
}

export const AILoadingProvider: React.FC<AILoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("L'operazione con l'AI è in corso");

  const showLoading = (customMessage?: string) => {
    setMessage(customMessage || "L'operazione con l'AI è in corso");
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <AILoadingContext.Provider value={{ isLoading, message, showLoading, hideLoading }}>
      {children}
      <AILoadingOverlay isVisible={isLoading} message={message} />
    </AILoadingContext.Provider>
  );
};

export default AILoadingContext;
