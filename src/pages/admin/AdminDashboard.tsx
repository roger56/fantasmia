import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Grid3x3, 
  FileText, 
  Settings, 
  BookOpen, 
  Calendar,
  Sparkles,
  Link
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  const governanceCards: DashboardCard[] = [
    {
      title: 'Gestione SuperUser (SU)',
      description: 'Crea, modifica e gestisci gli account SuperUser',
      icon: Users,
      path: '/admin/su-users'
    },
    {
      title: 'Tipi Organizzazione',
      description: 'Gestisci la lista dei tipi di organizzazione',
      icon: Building2,
      path: '/admin/org-types'
    },
    {
      title: 'Matrice Funzioni',
      description: 'Configura le funzioni disponibili per contratto',
      icon: Grid3x3,
      path: '/admin/features-matrix',
      badge: 'DEMO',
      badgeVariant: 'secondary'
    },
    {
      title: 'Contratti 3F',
      description: 'Visualizza i piani Free, Family, Fantasy',
      icon: FileText,
      path: '/admin/contracts-3f'
    },
    {
      title: 'Impostazioni ADMIN',
      description: 'Modifica password ADMIN',
      icon: Settings,
      path: '/admin/settings'
    },
    {
      title: 'NSU One-Time Links',
      description: 'Crea link di accesso temporaneo per ospiti',
      icon: Link,
      path: '/admin/one-time-links',
      badge: 'DEMO',
      badgeVariant: 'secondary'
    }
  ];

  const toolsCards: DashboardCard[] = [
    {
      title: 'Storie AG (gestore)',
      description: 'Gestione storie pubbliche per categoria',
      icon: BookOpen,
      path: '/admin/stories'
    },
    {
      title: 'Racconti del Giorno',
      description: 'Importa e gestisci i racconti quotidiani',
      icon: Calendar,
      path: '/admin/daily-stories'
    },
    {
      title: 'Farfalla + Dizionari',
      description: 'Impostazioni farfalla e parole personalizzate',
      icon: Sparkles,
      path: '/admin/system-settings'
    }
  ];

  const renderCard = (card: DashboardCard) => {
    const IconComponent = card.icon;
    return (
      <Card 
        key={card.path}
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-emerald-400 bg-white"
        onClick={() => navigate(card.path)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <IconComponent className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-emerald-900 truncate">
                  {card.title}
                </h3>
                {card.badge && (
                  <Badge variant={card.badgeVariant || 'secondary'} className="text-xs">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <p className="text-emerald-700 text-sm">{card.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout 
      title="Dashboard Amministratore"
      subtitle="Console di gestione sistema Fantasmia"
    >
      <div className="space-y-8">
        {/* Governance Section */}
        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Governance
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {governanceCards.map(renderCard)}
          </div>
        </section>

        {/* Tools Section */}
        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Strumenti (copie indipendenti)
          </h2>
          <p className="text-sm text-emerald-600 mb-4">
            Queste sono copie indipendenti degli strumenti SU, modificabili senza impatti sulla webapp.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {toolsCards.map(renderCard)}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
