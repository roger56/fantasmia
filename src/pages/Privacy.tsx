import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const Privacy = () => {
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
            <h1 className="text-2xl font-bold text-slate-800">Privacy</h1>
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
              <Shield className="w-6 h-6" />
              Privacy – FANTASMIA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 text-slate-700">
                <p className="text-lg">
                  Grazie per aver scelto FANTASMIA, l'app dedicata ai bambini (affiancati da un adulto) per creare storie originali e fantasiose.
                </p>

                <div>
                  <p className="mb-4">
                    Per completare l'iscrizione e attivare il profilo, è necessario che l'adulto confermi la propria presa visione e accettazione delle condizioni d'uso dell'app, tra cui:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>La responsabilità dei contenuti creati dai bambini;</li>
                    <li>La possibilità che le storie create da utenti non registrati o con profilo gratuito siano visibili pubblicamente;</li>
                    <li>Il rispetto della normativa sulla privacy secondo GDPR (UE 2016/679).</li>
                  </ul>
                </div>

                <p>
                  Cliccando sul link indicato, si conferma l'iscrizione e si accettano le condizioni indicate.
                </p>

                <p>
                  In caso il link non funzioni, è possibile rispondere a questa email scrivendo:
                </p>

                <div className="bg-slate-100 rounded-lg p-4 text-center italic">
                  "Confermo l'iscrizione e accetto le condizioni d'uso di FANTASMIA."
                </div>

                <p className="text-center font-medium">
                  Grazie per la fiducia!
                </p>

                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="font-bold text-slate-800">Il Team di FANTASMIA</p>
                  <p className="text-primary mt-2">www.fantasmia.it</p>
                  <p className="text-primary">info@fantasmia.it</p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;