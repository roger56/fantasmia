import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Atom, Sparkles, Mountain, Compass } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminStoryTypeSelection = () => {
  const navigate = useNavigate();

  const storyTypes = [
    { title: 'Storie di Lettura', description: 'Gestione storie del mondo', icon: BookOpen, path: '/admin/ag-reading-stories' },
    { title: 'Storie di Scienza', description: 'Gestione storie scientifiche', icon: Atom, path: '/admin/ag-science-stories' },
    { title: 'I Miti Greci', description: 'Gestione miti greci', icon: Sparkles, path: '/admin/ag-greek-myths' },
    { title: 'I Miti del Nord', description: 'Gestione miti nordici', icon: Mountain, path: '/admin/ag-nordic-myths' },
    { title: 'I Grandi Esploratori', description: 'Gestione storie di esploratori', icon: Compass, path: '/admin/ag-explorers' },
  ];

  return (
    <AdminLayout
      title="GESTIONE STORIE PUBBLICHE"
      subtitle="Seleziona tipologia di storia da gestire"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {storyTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <Card 
              key={type.path}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-emerald-400 bg-white" 
              onClick={() => navigate(type.path)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-emerald-700" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">{type.title}</h3>
                <p className="text-emerald-700 text-sm">{type.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminStoryTypeSelection;
