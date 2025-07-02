
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Plus, Play, Pause, Save } from 'lucide-react';

const Archive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName } = location.state || {};

  // Mock stories data
  const [stories] = useState([
    {
      id: '1',
      title: 'La Principessa e il Drago',
      status: 'completed',
      lastModified: '2 giorni fa',
      mode: 'GHOST'
    },
    {
      id: '2',
      title: 'Il Castello Magico',
      status: 'suspended',
      lastModified: '1 settimana fa',
      mode: 'PROPP'
    },
    {
      id: '3',
      title: 'L\'Avventura nel Bosco',
      status: 'completed',
      lastModified: '3 giorni fa',
      mode: 'GHOST'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completata';
      case 'suspended': return 'Sospesa';
      default: return 'In Corso';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return Save;
      case 'suspended': return Pause;
      default: return Play;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Archivio Favole</h1>
              {profileName && (
                <p className="text-slate-600">Profilo: {profileName}</p>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/create-story')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuova Favola
          </Button>
        </div>

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Nessuna favola trovata
              </h3>
              <p className="text-slate-600 mb-4">
                Inizia a creare la tua prima favola!
              </p>
              <Button onClick={() => navigate('/create-story')}>
                Crea Nuova Favola
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => {
              const StatusIcon = getStatusIcon(story.status);
              return (
                <Card 
                  key={story.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                  onClick={() => navigate(`/story/${story.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-slate-800 line-clamp-2">
                        {story.title}
                      </CardTitle>
                      <StatusIcon className="w-5 h-5 text-slate-500 flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                        {getStatusText(story.status)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {story.mode}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Modificata: {story.lastModified}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
