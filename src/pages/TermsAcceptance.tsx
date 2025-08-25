import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsAcceptance = () => {
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate('/privacy');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Accettazione Condizioni</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Condizioni d'uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-slate max-w-none">
              <p className="text-lg leading-relaxed">
                Per completare l'iscrizione e attivare il profilo, è necessario che l'adulto confermi la propria presa visione e accettazione delle condizioni d'uso dell'app, tra cui:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>La responsabilità dei contenuti creati dai bambini;</strong></li>
                <li><strong>La possibilità che le favole create da utenti non registrati o con profilo gratuito siano visibili pubblicamente;</strong></li>
                <li><strong>Il rispetto della normativa sulla privacy secondo GDPR (UE 2016/679).</strong></li>
              </ul>
            </div>

            <div className="flex justify-center space-x-4 pt-6">
              <Button variant="outline" onClick={() => navigate('/')}>
                Annulla
              </Button>
              <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                Confermo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAcceptance;