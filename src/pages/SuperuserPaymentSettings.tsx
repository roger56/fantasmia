import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { CLOUD_ENABLED, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserPaymentSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTotalCost = async () => {
      if (!CLOUD_ENABLED || !supabase) {
        console.log('💰 Cloud sync disabilitato, costi non disponibili');
        setTotalCost(0);
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await (supabase as any)
          .from('media_generations')
          .select('cost');

        if (error) {
          console.error('Error fetching cost data:', error);
          setTotalCost(0);
        } else {
          const total = data?.reduce((sum: number, record: any) => sum + (record.cost || 0), 0) || 0;
          setTotalCost(total);
        }
      } catch (error) {
        console.error('Error calculating total cost:', error);
        setTotalCost(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalCost();
    
    // Disable polling in development to avoid CORS/504 errors
    if (!import.meta.env.DEV) {
      // Set up auto-refresh every 30 seconds to update costs
      const interval = setInterval(fetchTotalCost, 30000);
      
      return () => clearInterval(interval);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-2xl font-bold text-slate-800">Modalità di Pagamento</h1>
              <p className="text-slate-600">Gestione dei costi e pagamenti OpenAI</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Cloud Sync Warning */}
          {!CLOUD_ENABLED && (
            <Alert className="border-yellow-400 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                ⚠️ Cloud Sync disabilitato - I costi delle generazioni AI non vengono tracciati
              </AlertDescription>
            </Alert>
          )}
          
          {/* Costo Totale Card */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="w-5 h-5" />
                COSTO SERVIZI MULTIMEDIALI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-blue-200 rounded mb-2"></div>
                    <div className="h-4 bg-blue-200 rounded w-1/2 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      €{totalCost.toFixed(3)}
                    </div>
                    <p className="text-blue-700">
                      Totale speso per generazione immagini
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configurazione Pagamenti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configurazione Pagamenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => toast({
                      title: "Funzione in sviluppo",
                      description: "La configurazione avanzata dei pagamenti sarà presto disponibile",
                      variant: "default"
                    })}
                  >
                    Configura Metodi di Pagamento
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast({
                      title: "Funzione in sviluppo", 
                      description: "L'esportazione del report costi sarà presto disponibile",
                      variant: "default"
                    })}
                  >
                    Esporta Report Costi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperuserPaymentSettings;