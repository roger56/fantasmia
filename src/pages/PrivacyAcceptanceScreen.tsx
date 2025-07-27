import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';

const PrivacyAcceptanceScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId, profileName } = location.state || {};

  const handleAccept = () => {
    navigate('/superuser-archive', { state: { profileId, profileName } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[80vh]">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Shield className="w-6 h-6 mr-2" />
              Privacy e Condizioni d'Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            <ScrollArea className="flex-1 mb-6">
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold text-lg mb-2">1. Raccolta e Uso dei Dati</h3>
                  <p>Questa applicazione raccoglie solo i dati necessari per il funzionamento del servizio. I profili creati e le storie generate vengono salvati localmente sul dispositivo dell'utente.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">2. Dati dei Minori</h3>
                  <p>L'applicazione è destinata principalmente a bambini e giovani utenti. Non raccogliamo dati personali sensibili. I genitori o tutori sono responsabili della supervisione dell'uso dell'applicazione da parte dei minori.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">3. Condivisione delle Storie</h3>
                  <p>Le storie create possono essere condivise pubblicamente solo se l'utente sceglie esplicitamente di farlo. Le storie private rimangono accessibili solo all'utente che le ha create.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">4. Sicurezza</h3>
                  <p>Ci impegniamo a mantenere sicuri i dati degli utenti. Tuttavia, nessun sistema è completamente sicuro e non possiamo garantire la sicurezza assoluta dei dati.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">5. Funzionalità di Sintesi Vocale</h3>
                  <p>L'applicazione utilizza le API di sintesi vocale del browser per leggere le storie ad alta voce. Questi dati non vengono inviati a server esterni.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">6. Modifiche alla Privacy</h3>
                  <p>Ci riserviamo il diritto di modificare questa informativa sulla privacy. Gli utenti saranno informati di eventuali modifiche significative.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">7. Contatti</h3>
                  <p>Per domande riguardo questa informativa sulla privacy, è possibile contattarci attraverso i canali ufficiali dell'applicazione.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold text-lg mb-2">Consenso</h3>
                  <p>Utilizzando questa applicazione, l'utente accetta i termini di questa informativa sulla privacy e acconsente al trattamento dei dati come descritto.</p>
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex justify-center pt-4 border-t">
              <Button 
                onClick={handleAccept}
                className="px-8 py-3 text-lg"
              >
                Accetto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyAcceptanceScreen;