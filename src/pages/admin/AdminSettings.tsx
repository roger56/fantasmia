import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Lock, AlertTriangle, Check } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { getAdminSettings, saveAdminSettings } from '@/utils/adminStorage';

const AdminSettingsPage = () => {
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasDemoPassword, setHasDemoPassword] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAdminSettings();
      setHasDemoPassword(!!settings.demoPassword);
    };
    loadSettings();
  }, []);

  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'La password è obbligatoria';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'La password deve avere almeno 8 caratteri';
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePassword = async () => {
    if (!validatePassword()) return;
    
    setIsSaving(true);
    try {
      await saveAdminSettings({ demoPassword: newPassword });
      toast({ 
        title: 'Password salvata',
        description: 'La password DEMO è stata aggiornata'
      });
      setNewPassword('');
      setConfirmPassword('');
      setHasDemoPassword(true);
    } catch (error) {
      toast({ 
        title: 'Errore', 
        description: 'Impossibile salvare la password', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout 
      title="Impostazioni ADMIN"
      subtitle="Configurazione dell'area amministrativa"
    >
      <div className="space-y-6 max-w-2xl">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Modalità DEMO:</strong> La password viene salvata solo localmente in IndexedDB. 
            In produzione verrà salvata lato server tramite API.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Modifica Password ADMIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasDemoPassword && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                <Check className="w-4 h-4" />
                Una password DEMO è già stata impostata
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({});
                }}
                placeholder="Minimo 8 caratteri"
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({});
                }}
                placeholder="Ripeti la password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              onClick={handleSavePassword} 
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? 'Salvataggio...' : 'Salva Password'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-4 h-4 text-slate-600" />
              Note tecniche
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              • Il login attuale usa l'endpoint API <code className="bg-slate-200 px-1 rounded">/api/admin/login</code> su Vercel
            </p>
            <p>
              • La password DEMO salvata qui non influenza il login effettivo finché non viene implementato 
              un endpoint <code className="bg-slate-200 px-1 rounded">/api/admin/change-password</code>
            </p>
            <p>
              • In produzione, questa sezione si collegherà al backend per la gestione sicura delle credenziali
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
