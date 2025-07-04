import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Globe } from 'lucide-react';
const Home = () => {
  const navigate = useNavigate();
  const mainOptions = [{
    id: 'profiles',
    title: 'Accedi ai Profili',
    icon: Users,
    description: 'Seleziona un profilo esistente o creane uno nuovo',
    path: '/profiles'
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 px-[12px] py-[12px]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8 py-[12px]">
          <h1 className="text-4xl font-bold mb-2 text-red-500">Fantas(m)ia</h1>
          <p className="text-lg text-sky-600">usa la tua FANTASIA FANTASMAGORICA</p>
        </div>

        {/* Main Options Grid */}
        <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto">
          {mainOptions.map(option => {
          const IconComponent = option.icon;
          return <Card key={option.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" onClick={() => navigate(option.path)}>
                <CardContent className="p-8 text-center py-[18px] px-[18px]">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {option.description}
                  </p>
                </CardContent>
              </Card>;
        })}
        </div>
      </div>
    </div>;
};
export default Home;