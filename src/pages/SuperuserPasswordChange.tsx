import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUsers, updateUser } from '@/utils/userStorage';
import bcrypt from 'bcryptjs';
import HomeButton from '@/components/HomeButton';

const SuperuserPasswordChange = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le nuove password non coincidono",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Errore",
        description: "La nuova password deve contenere almeno 6 caratteri",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current superuser
      const users = getUsers();
      const superuser = users.find(user => user.name === 'SuperUser');
      
      if (!superuser) {
        throw new Error('Superuser non trovato');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, superuser.password);
      
      if (!isCurrentPasswordValid) {
        toast({
          title: "Errore",
          description: "La password attuale non è corretta",
          variant: "destructive"
        });
        return;
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user with new password
      const updatedUser = {
        ...superuser,
        password: hashedNewPassword
      };

      updateUser(updatedUser);

      toast({
        title: "Successo",
        description: "Password aggiornata con successo",
        variant: "default"
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Navigate back to settings after a short delay
      setTimeout(() => {
        navigate('/superuser-settings');
      }, 2000);

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento della password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser-settings')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sicurezza</h1>
              <p className="text-slate-600">Modifica la password del Superuser</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Cambio Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Attuale</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Inserisci la password attuale"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Inserisci la nuova password (min. 6 caratteri)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Conferma la nuova password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/superuser-settings')}
                disabled={isLoading}
              >
                Annulla
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Aggiornamento...' : 'Aggiorna Password'}
              </Button>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="text-sm text-blue-800">
                <strong>Nota sulla sicurezza:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>La password deve contenere almeno 6 caratteri</li>
                  <li>Si consiglia di utilizzare una combinazione di lettere, numeri e simboli</li>
                  <li>Non condividere mai la password con altri</li>
                  <li>Cambia la password regolarmente per mantenere la sicurezza</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperuserPasswordChange;