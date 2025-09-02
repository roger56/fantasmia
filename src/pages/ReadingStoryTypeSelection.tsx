import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Atom } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const ReadingStoryTypeSelection = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/home');
        return;
      }
      
      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const storyTypes = [
    {
      id: 'science-magic',
      title: 'Magia della Scienza',
      icon: Atom,
      description: 'Storie che mescolano scienza e fantasia',
      path: '/reading-stories/science'
    },
    {
      id: 'magic-stories',
      title: 'Storie Magiche',
      icon: Sparkles,
      description: 'Racconti di pura magia e fantasia',
      path: '/reading-stories/magic'
    }
  ];

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title="Lettura Storie"
        subtitle="Scegli il tipo di storia da leggere"
        onBack={() => navigate('/dashboard')}
        showHomeButton={true}
      >
        {/* Story Type Selection Grid */}
        <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
          {storyTypes.map(storyType => {
            const IconComponent = storyType.icon;
            return (
              <Card 
                key={storyType.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
                onClick={() => navigate(storyType.path)}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {storyType.title}
                  </h3>
                  <p className="text-slate-600 text-xs">
                    {storyType.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </StoryLayout>
    </>
  );
};

export default ReadingStoryTypeSelection;