import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserPaymentSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTotalCost = async () => {
      try {
        const { data, error } = await supabase
          .from('media_generations')
          .select('cost');

        if (error) {
          console.error('Error fetching cost data:', error);
          return;
        }

        const total = data?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
        setTotalCost(total);
      } catch (error) {
        console.error('Error calculating total cost:', error);
        toast({
          title: "Errore",
          description: "Non è stato possibile calcolare il costo totale",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalCost();
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
          {/* Costo Totale Card */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="w-5 h-5" />
                Costo Totale OpenAI
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
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-2">Metodo di Pagamento Attuale</h3>
                  <p className="text-slate-600 text-sm">
                    OpenAI API Key configurata tramite variabili d'ambiente
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    I costi vengono addebitati direttamente sull'account OpenAI associato
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2">Nota Importante</h3>
                  <p className="text-amber-700 text-sm">
                    Il sistema utilizza l'API OpenAI DALL-E 3 per la generazione di immagini. 
                    Tutti i costi sono calcolati a €0,020 per immagine (512x512px).
                  </p>
                </div>

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