import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const NoteLegali = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Note Legali</h1>
            <Button variant="ghost" onClick={() => navigate('/profiles')}>
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <FileText className="w-6 h-6" />
              Disclaimer legale – Fonti narrative e uso dei contenuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 text-slate-700">
                <p>
                  L'app FANTASMIA si ispira a tecniche narrative e strumenti educativi provenienti da tradizioni culturali e didattiche consolidate, rielaborate in modo autonomo e originale.
                </p>
                <p>
                  Le idee di questo prodotto derivano da fonti aperte e ispirazioni pubbliche; non violiamo diritti di terzi ai sensi della legge 633/1941 sul diritto d'autore.
                </p>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-3">1. Fonti di ispirazione</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Il metodo creativo descritto in "Grammatica della Fantasia" di Gianni Rodari (1973).</li>
                    <li>Le 31 funzioni di Propp, codificate nel saggio "Morfologia della fiaba" di Vladimir Propp (1928).</li>
                    <li>Le 12 tappe del Viaggio dell'Eroe secondo l'interpretazione narrativa di Joseph Campbell (e successivamente rielaborate da Christopher Vogler).</li>
                  </ul>
                  <p className="mt-3">
                    Tali riferimenti sono rielaborati da FANTASMIA in forma autonoma e creativa, senza riprodurre testi, immagini o contenuti protetti da diritto d'autore. La struttura, l'interfaccia e le modalità di interazione dell'app sono originali.
                  </p>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-3">2. Situazione legale delle fonti</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>"Grammatica della Fantasia" è un'opera protetta da diritto d'autore: Gianni Rodari è deceduto nel 1980, pertanto i diritti scadranno il 1° gennaio 2051, salvo proroghe.</li>
                    <li>"Morfologia della fiaba" di Vladimir Propp (1928) è di pubblico dominio in molti Paesi, inclusa l'Italia.</li>
                    <li>Le opere di Joseph Campbell (1949) e le successive rielaborazioni di Vogler sono coperte da copyright; le strutture narrative in sé sono tuttavia considerate di uso comune in ambito educativo e creativo.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-3">3. Chiarezza di intenti</h2>
                  <p>
                    FANTASMIA non intende sostituirsi né affiliarsi agli autori citati o ai loro eredi/editori. L'uso di tali riferimenti ha finalità esclusivamente educative, formative e divulgative, e si configura come omaggio culturale al pensiero creativo e alla pedagogia narrativa.
                  </p>
                  <p className="mt-3">
                    Ogni contenuto generato all'interno dell'app è frutto di elaborazione indipendente ed è pensato per un utilizzo sicuro e inclusivo da parte di bambini, famiglie, educatori e contesti scolastici.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NoteLegali;
