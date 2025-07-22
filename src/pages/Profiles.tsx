
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Lock, Shield, Globe } from 'lucide-react';
import { getUsers, authenticateUser, markMessagesAsRead } from '@/utils/userStorage';
import HomeButton from '@/components/HomeButton';

const Profiles = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  
  useEffect(() => {
    const users = getUsers();
    setProfiles(users);
    
    // Add special profiles and new profile option
    const specialProfiles = [
      {
        id: 'new-profile',
        name: 'NUOVO PROFILO',
        type: 'NEW',
        icon: User,
        requiresPassword: false
      },
      {
        id: 'superuser',
        name: 'Superuser',
        type: 'SUPERUSER',
        icon: Shield,
        requiresPassword: true
      }
    ];
    
    setAllProfiles([...users, ...specialProfiles]);
  }, []);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    setPassword('');
    
    // Handle direct access for NEW PROFILE
    if (profileId === 'new-profile') {
      navigate('/new-profile');
      return;
    }
  };

  const handleLogin = () => {
    if (password.trim()) {
      if (selectedProfile === 'superuser') {
        if (password.toLowerCase() === 'ssss') {
          localStorage.setItem('fantasmia_superuser_authenticated', 'true');
          navigate('/superuser');
        } else {
          alert('Password non corretta');
        }
        return;
      }
      
      const selectedUser = profiles.find(p => p.id === selectedProfile);
      if (selectedUser) {
        const user = authenticateUser(selectedUser.name, password);
        if (user) {
          // Check for unread messages
          if (user.unreadMessages && user.unreadMessages.length > 0) {
            // Show messages and mark as read
            const messages = user.unreadMessages.filter(m => !m.read);
            if (messages.length > 0) {
              alert(`Hai ${messages.length} nuovi messaggi:\n\n${messages.map(m => m.content).join('\n\n')}`);
              markMessagesAsRead(user.id);
            }
          }
          navigate('/create-story', { state: { profileId: selectedProfile, profileName: selectedUser.name } });
        } else {
          alert('Password non corretta');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/home')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Elenco Profili</h1>
        </div>

        {!selectedProfile ? (
          /* Profile Selection */
          <Card>
            <CardHeader>
              <CardTitle>Seleziona Profilo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profilo
                </label>
                <Select onValueChange={handleProfileSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Scegli un profilo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {allProfiles.map((profile) => {
                      const IconComponent = profile.icon || User;
                      return (
                        <SelectItem key={profile.id} value={profile.id}>
                           <div className="flex items-center gap-2">
                             <IconComponent className="w-4 h-4" />
                             <span className={profile.type === 'NEW' ? 'font-bold' : ''}>{profile.name}</span>
                             {profile.type && profile.type !== 'NEW' && (
                               <span className="text-xs text-slate-500">({profile.type})</span>
                             )}
                           </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
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
                  Profilo selezionato: <strong>{allProfiles.find(p => p.id === selectedProfile)?.name}</strong>
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
