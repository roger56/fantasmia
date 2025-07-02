
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Lock } from 'lucide-react';

const Profiles = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  
  // Mock profiles data
  const profiles = [
    { id: '1', name: 'Marco', lastAccess: '2 giorni fa' },
    { id: '2', name: 'Sofia', lastAccess: '1 settimana fa' },
    { id: '3', name: 'Alessandro', lastAccess: '3 giorni fa' }
  ];

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    setPassword('');
  };

  const handleLogin = () => {
    if (password.trim()) {
      // Simulate login
      navigate('/archive', { state: { profileId: selectedProfile } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Elenco Profili</h1>
        </div>

        {!selectedProfile ? (
          /* Profile Selection */
          <div className="space-y-4">
            {profiles.map((profile) => (
              <Card 
                key={profile.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                onClick={() => handleProfileSelect(profile.id)}
              >
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">{profile.name}</h3>
                    <p className="text-slate-600 text-sm">Ultimo accesso: {profile.lastAccess}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Password Input */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Inserisci Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-600 mb-4">
                  Profilo selezionato: <strong>{profiles.find(p => p.id === selectedProfile)?.name}</strong>
                </p>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setSelectedProfile(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Indietro
                </Button>
                <Button 
                  onClick={handleLogin}
                  disabled={!password.trim()}
                  className="flex-1"
                >
                  Accedi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profiles;
