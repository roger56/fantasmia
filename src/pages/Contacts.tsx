import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Contacts = () => {
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
            <h1 className="text-2xl font-bold text-slate-800">Contatti</h1>
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
              <Mail className="w-6 h-6" />
              Contattaci
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg mb-6">
              Per qualsiasi informazione, supporto o domanda su FANTASMIA:
            </p>
            <div className="bg-slate-50 rounded-lg p-6">
              <a 
                href="mailto:info@fantasmia.it" 
                className="text-2xl font-semibold text-primary hover:underline"
              >
                info@fantasmia.it
              </a>
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