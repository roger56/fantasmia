
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveUser } from '@/utils/userStorage';
import HomeButton from '@/components/HomeButton';

const NewProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci un nome per il profilo",
        variant: "destructive"
      });
      return;
    }

    // Create user with password same as name
    const newUser = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      password: formData.name.trim(), // Password same as name
      lastAccess: new Date().toISOString(),
      unreadMessages: []
    };

    saveUser(newUser);

    toast({
      title: "Profilo creato!",
      description: `Il profilo ${formData.name} è stato creato con successo`,
    });

    // Navigate to archive with new profile
    setTimeout(() => {
      navigate('/archive', { state: { profileId: newUser.id, profileName: newUser.name } });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Nuovo Profilo</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Crea Profilo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Profilo
              </label>
              <Input
                type="text"
                placeholder="Inserisci il nome"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email (facoltativo)
              </label>
              <Input
                type="email"
                placeholder="Inserisci l'email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                La password sarà uguale al nome del profilo
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1"
              >
                Crea Profilo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewProfile;
