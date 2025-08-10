import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Privacy</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Informativa Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="copyright">
                <AccordionTrigger className="text-lg font-semibold">
                  Diritti d'autore
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-96 w-full">
                    <div className="space-y-6 text-sm leading-relaxed">
                      <div>
                        <h4 className="font-semibold mb-2">a. Disclaimer legale sull'uso di contenuti ispirati a opere educative e narrative</h4>
                        <p>
                          L'app FANTAS-Mia si ispira a tecniche narrative e strumenti educativi provenienti da tre principali fonti tradizionali, culturali e didattiche orali:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>il metodo creativo descritto in "Grammatica della Fantasia" di Gianni Rodari (1973);</li>
                          <li>le 31 funzioni di Propp, codificate nel saggio "Morfologia della fiaba" di Vladimir Propp (1928);</li>
                          <li>le 12 tappe del Viaggio dell'Eroe secondo l'interpretazione narrativa di Joseph Campbell (e successivamente Vogler).</li>
                        </ul>
                        <p className="mt-2">
                          Tutti questi riferimenti vengono rielaborati da FANTASMIA in forma autonoma e creativa, senza riproduzione letterale, immediatamente riconoscibile dei contenuti protetti da diritto d'autore. La struttura e l'interfaccia dell'app sono originali, così come le modalità di interazione e le domande guidate.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">b. Situazione legale delle fonti:</h4>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>L'opera Grammatica della Fantasia è tuttora protetta da diritto d'autore: Gianni Rodari è deceduto nel 1980, quindi la scadenza dei diritti è prevista per il 1° gennaio 2051, salvo proroghe;</li>
                          <li>L'opera di Propp, pubblicata in URSS nel 1928, è di pubblico dominio in molti Paesi, tra cui l'Italia;</li>
                          <li>Il Viaggio dell'Eroe di Campbell (1949) e le successive sintesi (es. Vogler) sono ancora coperte da copyright per i testi originali, ma le strutture narrative in sé sono considerate di dominio comune in ambito educativo e creativo.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">c. Chiarezza d'intenti:</h4>
                        <p>
                          FANTAS-Mia non intende sostituirsi né affiliarsi agli autori citati né ai loro eredi/editori. L'uso di tali fonti ha finalità didattiche, formative e divulgative, ed è concepito come omaggio culturale al pensiero creativo e alla pedagogia narrativa.
                        </p>
                        <p className="mt-2">
                          Ogni contenuto dell'app è frutto di elaborazione indipendente e adattato per l'utilizzo sicuro e inclusivo da parte di bambini, famiglie, educatori e gruppi scolastici.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="terms">
                <AccordionTrigger className="text-lg font-semibold">
                  Accettazione condizioni d'uso
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm leading-relaxed">
                    <p>
                      Grazie per aver scelto FANTASMIA, l'app dedicata ai bambini (affiancati da un adulto) per creare storie originali e fantasiose.
                    </p>
                    <p>
                      Per completare l'iscrizione e attivare il profilo, è necessario che l'adulto confermi la propria presa visione e accettazione delle condizioni d'uso dell'app, tra cui:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>La responsabilità dei contenuti creati dai bambini;</li>
                      <li>La possibilità che le favole create da utenti non registrati o con profilo gratuito siano visibili pubblicamente;</li>
                      <li>Il rispetto della normativa sulla privacy secondo GDPR (UE 2016/679).</li>
                    </ul>
                    <p className="mt-4 font-medium">
                      👉 Cliccando sul link qui sotto, conferma l'iscrizione e accetta le condizioni indicate:
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;