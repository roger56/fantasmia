
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, Users, BookOpen, Settings } from 'lucide-react';

const SuperUser = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (password === 'admin123') { // Mock password
      setIsAuthenticated(true);
    }
  };

  const dashboardOptions = [
    {
      title: 'Gestione Utenti',
      description: 'Visualizza e gestisci tutti gli utenti',
      icon: Users,
      action: () => navigate('/superuser/users')
    },
    {
      title: 'Archivio Completo',
      description: 'Tutte le favole con categorie e autori',
      icon: BookOpen,
      action: () => navigate('/superuser/archive')
    },
    {
      title: 'Impostazioni',
      description: 'Configurazioni di sistema',
      icon: Settings,
      action: () => navigate('/superuser/settings')
    }
  ];

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
          <h1 className="text-2xl font-bold text-slate-800">Superuser</h1>
        </div>

        {!isAuthenticated ? (
          /* Login Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Accesso Amministratore
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password Amministratore
                </label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button 
                onClick={handleLogin}
                disabled={!password.trim()}
                className="w-full"
              >
                Accedi
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Dashboard */
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  Dashboard Amministratore
                </h2>
                <p className="text-slate-600">
                  Benvenuto nel pannello di controllo di Fantasmia
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {dashboardOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                    onClick={option.action}
                  >
                    <CardContent className="p-6 flex items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                        <IconComponent className="w-6 h-6 text-slate-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">{option.title}</h3>
                        <p className="text-slate-600 text-sm">{option.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperUser;
