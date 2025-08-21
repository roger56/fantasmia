import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, Microscope } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const StoryTypeSelection = () => {
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
      id: 'magic-stories',
      title: 'Storie Magiche',
      subtitle: 'racconti fantastici',
      icon: Wand2,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      path: '/reading-stories'
    },
    {
      id: 'science-stories',
      title: 'Magia della Scienza',
      subtitle: 'brevi storielle che spiegano fenomeni naturali',
      icon: Microscope,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      path: '/science-stories'
    }
  ];

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title="Leggi Storie"
        subtitle="Scegli il tipo di storia che vuoi leggere"
        onBack={() => navigate('/dashboard')}
        showHomeButton={true}
      >
        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          {storyTypes.map(type => {
            const IconComponent = type.icon;
            return (
              <Card 
                key={type.id} 
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300 ${type.hoverColor}`}
                onClick={() => navigate(type.path)}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className={`w-16 h-16 ${type.bgColor} rounded-full flex items-center justify-center mb-2`}>
                      <IconComponent className={`w-8 h-8 ${type.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {type.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {type.subtitle}
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

export default StoryTypeSelection;