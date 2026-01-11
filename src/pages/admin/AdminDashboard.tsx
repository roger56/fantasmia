import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Home, Shield } from 'lucide-react';
import { ADMIN_AUTH_KEY } from '@/components/admin/AdminGuard';
import { adminLogout } from '@/lib/adminAuth';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    // Cancella flag locale
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    
    // Tenta logout API (opzionale, non blocca se fallisce)
    try {
      await adminLogout();
    } catch {
      // Ignora errori - l'importante è che il flag locale sia cancellato
    }

    toast({
      title: 'Logout effettuato',
      description: "Sei uscito dall'area admin"
    });

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Area ADMIN</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center pt-20 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-amber-600" />
              Dashboard Amministratore
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-600">
            <p>Benvenuto nell'area di amministrazione.</p>
            <p className="mt-2 text-sm">
              Questa pagina verrà ampliata con le funzionalità admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
