
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const handleSkip = () => {
    navigate('/introductory-screens');
  };

  const handleNext = () => {
    if (currentPage === 0) {
      setCurrentPage(1);
    } else {
      navigate('/introductory-screens');
    }
  };

  const handlePrev = () => {
    if (currentPage === 1) {
      setCurrentPage(0);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentPage === 0) {
      setCurrentPage(1);
    } else if (direction === 'right' && currentPage === 1) {
      setCurrentPage(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      <div 
        className="flex transition-transform duration-300 ease-in-out h-full"
        style={{ transform: `translateX(-${currentPage * 100}%)` }}
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX;
          const handleTouchEnd = (endEvent: TouchEvent) => {
            const endX = endEvent.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                handleSwipe('left');
              } else {
                handleSwipe('right');
              }
            }
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        {/* Page 1 - Image */}
        <div className="min-w-full h-screen flex flex-col items-center justify-center p-4">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <img 
                src="/lovable-uploads/170eaf16-04ae-432a-840f-5e521ebd4d9c.png" 
                alt="Fantasmia Logo" 
                className="w-80 h-80 object-contain mx-auto mb-8"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center w-full max-w-md">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentPage === 0 ? 'bg-slate-800' : 'bg-slate-300'}`} />
              <div className={`w-3 h-3 rounded-full ${currentPage === 1 ? 'bg-slate-800' : 'bg-slate-300'}`} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSkip} variant="outline" className="px-6">
                Salta
              </Button>
              <Button onClick={handleNext} className="px-6">
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page 2 - Description */}
        <div className="min-w-full h-screen flex flex-col items-center justify-center p-4">
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-2xl w-full">
              <CardContent className="p-8 text-center">
                <h1 className="text-3xl font-bold mb-6 text-red-500">
                  Ciao e benvenuto su FANTAS(m)IA!
                </h1>
                <div className="text-lg text-slate-700 space-y-4 leading-relaxed">
                  <p>
                    <strong>Inventa la tua storia con la TUA FANTASIA FANTASMAGORICA!</strong>
                  </p>
                  <p>
                    Qui puoi creare storie uniche e divertenti, proprio come fanno i veri scrittori. Ti faremo qualche domanda buffa, oppure ti daremo delle carte magiche o delle parole misteriose… e tu potrai inventare tutto con la tua immaginazione!
                  </p>
                  <p>
                    Puoi scrivere o parlare, leggere la tua storia ad alta voce o ascoltarla con la voce magica dell'app. E se vuoi, puoi anche salvare le tue storie e rileggerle ogni volta che vuoi!
                  </p>
                  <p>
                    Scegli la tua modalità preferita: <strong>GHOST</strong>, <strong>PROPP</strong>, <strong>AIROTS</strong> o <strong>UNA PAROLA, TANTE STORIE</strong>… e inizia subito l'avventura!
                  </p>
                  <p className="text-xl font-semibold text-sky-600">
                    Pronto? scegli un profilo e Premi 'Nuova Storia'… che la magia abbia inizio!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-between items-center w-full max-w-md">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentPage === 0 ? 'bg-slate-800' : 'bg-slate-300'}`} />
              <div className={`w-3 h-3 rounded-full ${currentPage === 1 ? 'bg-slate-800' : 'bg-slate-300'}`} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handlePrev} variant="outline" className="px-6">
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
              <Button onClick={handleSkip} variant="outline" className="px-6">
                Salta
              </Button>
              <Button onClick={handleNext} className="px-6">
                Vai avanti
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
