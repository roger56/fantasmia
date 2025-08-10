import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Contacts = () => {
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
            <h1 className="text-2xl font-bold text-slate-800">Contatti</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Mail className="w-6 h-6" />
              Contattaci
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg mb-4">
              Per qualsiasi informazione, supporto o domanda su FANTAS-Mia, non esitare a contattarci:
            </p>
            <div className="bg-slate-50 rounded-lg p-6">
              <p className="text-xl font-mono font-semibold text-slate-800">
                quando.ruggero@gmail.com
              </p>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              Ti risponderemo il prima possibile!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contacts;