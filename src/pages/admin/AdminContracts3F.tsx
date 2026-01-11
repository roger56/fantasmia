import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, FileText, Info } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ContractFeature {
  name: string;
  free: boolean;
  family: boolean;
  fantasy: boolean;
}

const AdminContracts3F = () => {
  const features: ContractFeature[] = [
    { name: 'Creazione storie base', free: true, family: true, fantasy: true },
    { name: 'Dizionario IT', free: true, family: true, fantasy: true },
    { name: 'Max profili NSU', free: false, family: false, fantasy: false }, // Special case
    { name: 'Dizionario EN', free: false, family: true, fantasy: true },
    { name: 'Farfalla "Conosci la parola"', free: false, family: true, fantasy: true },
    { name: 'MEDIA(AI): migliora testo', free: false, family: true, fantasy: true },
    { name: 'MEDIA(AI): poesia', free: false, family: true, fantasy: true },
    { name: 'Racconti del giorno', free: false, family: true, fantasy: true },
    { name: 'MEDIA(AI): disegno', free: false, family: false, fantasy: true },
    { name: 'MEDIA(AI): filmato', free: false, family: false, fantasy: true },
    { name: 'Creazione album', free: false, family: false, fantasy: true },
    { name: 'Storie AG (archivio pubblico)', free: false, family: false, fantasy: true },
  ];

  const nsuLimits = {
    free: '5',
    family: '10',
    fantasy: 'Illimitati'
  };

  const contracts = [
    {
      name: 'Free',
      color: 'bg-slate-100 border-slate-300',
      headerColor: 'bg-slate-600',
      description: 'Piano base gratuito per iniziare',
      price: 'Gratuito'
    },
    {
      name: 'Family',
      color: 'bg-blue-50 border-blue-300',
      headerColor: 'bg-blue-600',
      description: 'Per famiglie e piccoli gruppi',
      price: '€ 4.99/mese'
    },
    {
      name: 'Fantasy',
      color: 'bg-purple-50 border-purple-300',
      headerColor: 'bg-purple-600',
      description: 'Accesso completo a tutte le funzionalità',
      price: '€ 9.99/mese'
    }
  ];

  const FeatureIcon = ({ included }: { included: boolean }) => (
    included ? (
      <Check className="w-5 h-5 text-green-600" />
    ) : (
      <X className="w-5 h-5 text-slate-300" />
    )
  );

  return (
    <AdminLayout 
      title="Contratti 3F"
      subtitle="Panoramica dei piani Free, Family e Fantasy"
    >
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Questa è una pagina informativa per il pitch. I piani non sono ancora applicati a runtime.
          </AlertDescription>
        </Alert>

        {/* Contract Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {contracts.map((contract) => {
            const contractKey = contract.name.toLowerCase() as 'free' | 'family' | 'fantasy';
            
            return (
              <Card 
                key={contract.name} 
                className={`${contract.color} border-2 overflow-hidden`}
              >
                <div className={`${contract.headerColor} text-white p-4 text-center`}>
                  <h3 className="text-2xl font-bold">{contract.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{contract.description}</p>
                  <Badge className="mt-2 bg-white/20 text-white border-white/30">
                    {contract.price}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* NSU Limit - Special display */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm font-medium">Max profili NSU</span>
                      <Badge variant="outline" className="font-bold">
                        {nsuLimits[contractKey]}
                      </Badge>
                    </div>
                    
                    {/* Features */}
                    {features.filter(f => f.name !== 'Max profili NSU').map((feature) => (
                      <div 
                        key={feature.name} 
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm text-slate-700">{feature.name}</span>
                        <FeatureIcon included={feature[contractKey]} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Tabella comparativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-4">Funzionalità</th>
                    <th className="text-center py-3 px-4 bg-slate-100">Free</th>
                    <th className="text-center py-3 px-4 bg-blue-50">Family</th>
                    <th className="text-center py-3 px-4 bg-purple-50">Fantasy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-slate-50">
                    <td className="py-3 px-4 font-medium">Max profili NSU</td>
                    <td className="text-center py-3 px-4">5</td>
                    <td className="text-center py-3 px-4">10</td>
                    <td className="text-center py-3 px-4">∞</td>
                  </tr>
                  {features.filter(f => f.name !== 'Max profili NSU').map((feature, index) => (
                    <tr key={feature.name} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-3 px-4">{feature.name}</td>
                      <td className="text-center py-3 px-4">
                        <FeatureIcon included={feature.free} />
                      </td>
                      <td className="text-center py-3 px-4">
                        <FeatureIcon included={feature.family} />
                      </td>
                      <td className="text-center py-3 px-4">
                        <FeatureIcon included={feature.fantasy} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminContracts3F;
