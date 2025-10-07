import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
          {/* Logo placeholder - da sostituire con logo reale */}
          <div className="mb-6 flex justify-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            FANTASMIA-V0
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Crea una storia con la tua Fantas-Mia
          </p>
          
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