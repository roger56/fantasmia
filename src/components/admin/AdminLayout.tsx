import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Home, LogOut } from 'lucide-react';
import { ADMIN_AUTH_KEY } from '@/components/admin/AdminGuard';
import { adminLogout } from '@/lib/adminAuth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-800/95 backdrop-blur-sm border-b border-emerald-900">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-emerald-200" />
            <span className="font-bold text-white text-lg">AREA ADMIN</span>
            <Badge variant="outline" className="bg-orange-500 text-white border-orange-600 text-xs">
              DEMO
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-emerald-100 hover:text-white hover:bg-emerald-700"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-transparent border-emerald-300 text-emerald-100 hover:bg-emerald-700 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content with padding for fixed header */}
      <div className="flex-1 pt-16">
        {(title || subtitle) && (
          <div className="px-4 py-6 bg-emerald-100/50 border-b border-emerald-200">
            <div className="max-w-7xl mx-auto">
              {title && (
                <h1 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-emerald-700 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        )}
        <div className="p-4 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
