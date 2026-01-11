import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Grid3x3, AlertTriangle, Save } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { 
  getFeatureAssignments, 
  saveAllFeatureAssignments,
  DEFAULT_FEATURES,
  type AdminFeatureAssignment
} from '@/utils/adminStorage';

type Contract = 'Free' | 'Family' | 'Fantasy';

const AdminFeaturesMatrix = () => {
  const { toast } = useToast();
  
  const [assignments, setAssignments] = useState<AdminFeatureAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFeatureAssignments();
      setAssignments(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading features:', error);
      toast({ title: 'Errore', description: 'Impossibile caricare la matrice', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isFeatureEnabled = (featureId: string, contract: Contract): boolean => {
    const assignment = assignments.find(
      a => a.featureId === featureId && a.contract3F === contract
    );
    return assignment?.enabled ?? false;
  };

  const toggleFeature = (featureId: string, contract: Contract) => {
    setAssignments(prev => {
      return prev.map(a => {
        if (a.featureId === featureId && a.contract3F === contract) {
          return { ...a, enabled: !a.enabled };
        }
        return a;
      });
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveAllFeatureAssignments(assignments);
      toast({ title: 'Salvato', description: 'Matrice funzioni salvata' });
      setHasChanges(false);
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare', variant: 'destructive' });
    }
  };

  const contracts: Contract[] = ['Free', 'Family', 'Fantasy'];

  const getContractColor = (contract: Contract) => {
    switch (contract) {
      case 'Free': return 'bg-slate-100 text-slate-700';
      case 'Family': return 'bg-blue-100 text-blue-700';
      case 'Fantasy': return 'bg-purple-100 text-purple-700';
    }
  };

  return (
    <AdminLayout 
      title="Matrice Funzioni"
      subtitle="Configura le funzioni disponibili per ogni tipo di contratto"
    >
      <div className="space-y-6">
        <Alert className="bg-amber-50 border-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Configurazione DEMO</AlertTitle>
          <AlertDescription className="text-amber-700">
            Questa matrice è solo per configurazione. <strong>Non è ancora applicata a runtime</strong> - 
            le modifiche qui non bloccano o abilitano funzioni nella webapp.
          </AlertDescription>
        </Alert>

        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              Salva modifiche
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-emerald-600" />
              Funzioni per Contratto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Caricamento...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Funzione
                      </th>
                      {contracts.map(contract => (
                        <th 
                          key={contract} 
                          className={`text-center py-3 px-4 font-semibold ${getContractColor(contract)} rounded-t-lg`}
                        >
                          {contract}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEFAULT_FEATURES.map((feature, index) => (
                      <tr 
                        key={feature.id} 
                        className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}
                      >
                        <td className="py-3 px-4 text-slate-700">
                          {feature.name}
                        </td>
                        {contracts.map(contract => (
                          <td key={contract} className="text-center py-3 px-4">
                            <Checkbox
                              checked={isFeatureEnabled(feature.id, contract)}
                              onCheckedChange={() => toggleFeature(feature.id, contract)}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-slate-700 mb-2">Legenda:</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-200"></div>
                <span>Free - Piano base gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-200"></div>
                <span>Family - Piano famiglia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-200"></div>
                <span>Fantasy - Piano completo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturesMatrix;
