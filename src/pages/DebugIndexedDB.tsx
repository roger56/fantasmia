import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Database, User, FileText, Image, Home, ArrowLeft } from 'lucide-react';
import { fantasMiaDB, Profile, AMStory, AGStory } from '@/utils/indexedDB';
import { getCurrentProfileId, createDemoProfile } from '@/utils/profileManager';
import { runAutomaticTest } from '@/utils/storyManager';
import { toast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

interface DebugData {
  profiles: { count: number; items: Profile[] };
  amStories: { count: number; items: AMStory[] };
  agStories: { count: number; items: AGStory[] };
  mediaAssets: { count: number };
}

const DebugIndexedDB = () => {
  const navigate = useNavigate();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  // Verifiche ambiente
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  useEffect(() => {
    loadDebugData();
    setCurrentProfileId(getCurrentProfileId());
  }, []);

  const loadDebugData = async () => {
    setLoading(true);
    try {
      await fantasMiaDB.init();
      
      const profiles = await fantasMiaDB.getProfiles();
      const amStories = await getAllAMStories();
      const agStories = await getAllAGStories();
      
      setDebugData({
        profiles: { count: profiles.length, items: profiles },
        amStories: { count: amStories.length, items: amStories },
        agStories: { count: agStories.length, items: agStories },
        mediaAssets: { count: 0 } // TODO: implementare conteggio media
      });
    } catch (error) {
      console.error('Errore caricamento debug data:', error);
      toast({
        title: "Errore Debug",
        description: "Impossibile caricare i dati IndexedDB",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllAMStories = async (): Promise<AMStory[]> => {
    try {
      await fantasMiaDB.init(); // Ensure DB is initialized
      const transaction = fantasMiaDB['db']!.transaction(['am_stories'], 'readonly');
      const store = transaction.objectStore('am_stories');
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('am_stories:', request.result.length, 'records');
          resolve(request.result);
        };
        request.onerror = () => {
          console.error('Errore lettura am_stories:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Errore lettura am_stories:', error);
      return [];
    }
  };

  const getAllAGStories = async (): Promise<AGStory[]> => {
    try {
      await fantasMiaDB.init(); // Ensure DB is initialized
      const transaction = fantasMiaDB['db']!.transaction(['ag_stories'], 'readonly');
      const store = transaction.objectStore('ag_stories');
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('ag_stories:', request.result.length, 'records');
          resolve(request.result);
        };
        request.onerror = () => {
          console.error('Errore lettura ag_stories:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Errore lettura ag_stories:', error);
      return [];
    }
  };

  const handleTestAM = async () => {
    try {
      const success = await runAutomaticTest();
      toast({
        title: success ? "✅ Test Superato" : "❌ Test Fallito",
        description: success ? "AM funziona correttamente" : "Controlla la console per dettagli",
        variant: success ? "default" : "destructive"
      });
      
      if (success) {
        await loadDebugData();
      }
    } catch (error) {
      console.error('Errore test AM:', error);
      toast({
        title: "❌ Test Errore",
        description: "Impossibile eseguire il test",
        variant: "destructive"
      });
    }
  };

  const hardReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    window.location.reload();
  };

  const handleCreateDemoProfile = async () => {
    try {
      const newProfileId = await createDemoProfile();
      setCurrentProfileId(newProfileId);
      await loadDebugData();
      toast({
        title: "✅ Profilo Demo Creato",
        description: `Nuovo profilo: ${newProfileId.slice(0, 8)}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Errore creazione profilo demo:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile creare profilo demo",
        variant: "destructive"
      });
    }
  };

  if (!isDevelopment) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center pt-20">Caricamento dati debug...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />
      
      {/* Fixed Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Back Button - Top Left */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          {/* Page Title - Center */}
          <h1 className="text-xl font-bold text-slate-800">🔍 Debug IndexedDB</h1>
          
          {/* Home Button - Top Right */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profiles')}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      <div className="max-w-6xl mx-auto pt-20 space-y-6">
        
        {/* Banner se nessun profilo selezionato */}
        {!currentProfileId && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-3">
                <div><strong>Nessun profilo selezionato</strong></div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/profiles')}
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                  >
                    Scegli profilo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCreateDemoProfile}
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                  >
                    Crea profilo demo
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Info Ambiente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Informazioni Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Origin:</strong> {window.location.origin}</div>
            <div><strong>Current Profile ID:</strong> {currentProfileId || 'Nessuno'}</div>
            <div><strong>Service Worker:</strong> {hasServiceWorker ? 'Presente' : 'Assente'}</div>
            
            <div className="mt-4">
              <Button onClick={hardReload} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Hard Reload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiche Store */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData?.profiles.count || 0}</div>
              {debugData?.profiles.items.map(p => (
                <div key={p.id} className="text-xs text-gray-600 truncate">
                  {p.name} ({p.id.slice(0, 8)})
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                AM Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData?.amStories.count || 0}</div>
              {debugData?.amStories.items.slice(0, 3).map(s => (
                <div key={s.id} className="text-xs text-gray-600 truncate">
                  {s.title} → {s.ownerProfileId.slice(0, 8)}
                </div>
              ))}
              {(debugData?.amStories.count || 0) === 0 && currentProfileId && (
                <div className="text-xs text-orange-600 mt-2">
                  💡 Nessuna storia per profilo {currentProfileId.slice(0, 8)} . Controlla ownerProfileId.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                AG Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData?.agStories.count || 0}</div>
              {debugData?.agStories.items.slice(0, 3).map(s => (
                <div key={s.id} className="text-xs text-gray-600 truncate">
                  {s.title} ({s.category})
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-600" />
                Media Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData?.mediaAssets.count || 0}</div>
              <div className="text-xs text-gray-500">Non implementato</div>
            </CardContent>
          </Card>

        </div>

        {/* Azioni */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Azioni Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={loadDebugData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Ricarica Dati IndexedDB
            </Button>
            
            <Button onClick={handleTestAM} variant="secondary">
              🧪 Test Rapido AM
            </Button>
          </CardContent>
        </Card>

        {/* Dettagli AM Stories */}
        {debugData && debugData.amStories.count > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dettagli AM Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {debugData.amStories.items.map(story => (
                  <div key={story.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div><strong>ID:</strong> {story.id}</div>
                    <div><strong>Title:</strong> {story.title}</div>
                    <div><strong>Owner:</strong> {story.ownerProfileId}</div>
                    <div><strong>Mode:</strong> {story.mode}</div>
                    <div><strong>Created:</strong> {new Date(story.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default DebugIndexedDB;