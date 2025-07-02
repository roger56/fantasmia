
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NewProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
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

    if (!formData.password.trim()) {
      toast({
        title: "Password richiesta",
        description: "Inserisci una password per il profilo",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "Le password inserite non coincidono",
        variant: "destructive"
      });
      return;
    }

    // Simulate profile creation
    toast({
      title: "Profilo creato!",
      description: `Il profilo ${formData.name} è stato creato con successo`,
    });

    // Navigate to archive with new profile
    setTimeout(() => {
      navigate('/archive', { state: { profileId: 'new', profileName: formData.name } });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
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
                Password
              </label>
              <Input
                type="password"
                placeholder="Inserisci la password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Conferma Password
              </label>
              <Input
                type="password"
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="text-lg"
              />
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
