import React from 'react';
import StoryLayout from '@/components/shared/StoryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Atom, Sparkles } from 'lucide-react';

const SuperuserStoryTypeSelection = () => {
  const navigate = useNavigate();

  return (
    <StoryLayout
      title="Gestione Storie SU"
      subtitle="Area Superuser - Seleziona tipo di storia da gestire"
      onBack={() => navigate('/superuser')}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
            onClick={() => navigate('/superuser-reading-stories-management')}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-700" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Gestisci Storie di Lettura
              </h3>
              <p className="text-slate-600 text-sm">
                Crea e gestisci storie del mondo
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
            onClick={() => navigate('/superuser-science-stories-management')}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Atom className="w-8 h-8 text-slate-700" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Gestisci Storie di Scienza
              </h3>
              <p className="text-slate-600 text-sm">
                Crea e gestisci storie scientifiche
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
            onClick={() => navigate('/superuser-greek-myths-management')}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-slate-700" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Gestisci Storie dei Miti Greci
              </h3>
              <p className="text-slate-600 text-sm">
                Crea e gestisci miti greci
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoryLayout>
  );
};

export default SuperuserStoryTypeSelection;