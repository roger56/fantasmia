import React from 'react';
import { Loader2 } from 'lucide-react';

interface BootstrapLoadingOverlayProps {
  message?: string;
}

const BootstrapLoadingOverlay: React.FC<BootstrapLoadingOverlayProps> = ({
  message = 'Caricamento...'
}) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <p className="text-slate-600 text-lg font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default BootstrapLoadingOverlay;
