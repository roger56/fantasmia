import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import fantasmiaLogo from '@/assets/fantasmia-logo.png';

const NewHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <nav className="w-full bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">FANTASMIA-V0</div>
          <div className="hidden md:flex space-x-8">
            <Button variant="ghost" onClick={() => navigate('/')}>HOME</Button>
            <Button variant="ghost" onClick={() => navigate('/about')}>ABOUT</Button>
            <Button variant="ghost" onClick={() => navigate('/profiles')}>PROFILES</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl w-full text-center">
          {/* Logo ufficiale */}
          <div className="mb-6 flex justify-center">
            <img 
              src={fantasmiaLogo} 
              alt="Fantasmia Logo" 
              className="w-64 h-auto"
            />
          </div>
          
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            FANTASMIA-V0
          </h1>
          <div className="text-center mb-8 px-4">
            <p className="text-xl font-bold text-red-600 mb-3">
              Con la tua Fantas-Mia puoi inventare, creare e sognare!
            </p>
            <p className="text-xl text-slate-600">
              Ogni storia nasce da te: scegli, rispondi e guarda la magia prendere forma.
              <br />
              Diventa il protagonista delle tue avventure… la fantasia aspetta solo te!
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
            <Button
              onClick={() => navigate('/profiles')}
              className="h-16 text-lg"
            >
              Accedi Profili
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewHome;