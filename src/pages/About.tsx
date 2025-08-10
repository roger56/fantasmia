import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
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
            <h1 className="text-2xl font-bold text-slate-800">Cos'è FANTAS-Mia</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">FANTAS-Mia</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p className="text-lg leading-relaxed">
              <strong>FANTAS-Mia</strong> è un'app educativa progettata per accompagnare bambini e bambine nello sviluppo della propria <em>immaginazione narrativa</em>, in modo libero, coinvolgente e personalizzato.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">🎤 Racconto a voce</h3>
            <p>
              Grazie al <strong>riconoscimento vocale</strong> (STT – Speech to Text), i bambini possono raccontare con la propria voce ogni parte della loro storia, sviluppando <em>espressione orale</em>, <em>costruzione logica</em> e <em>senso narrativo</em>.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">👂 Ascolto attivo</h3>
            <p>
              Con la funzione <strong>Text-to-Speech</strong> (TTS), ogni storia può essere riascoltata, favorendo la comprensione e rafforzando l'<em>autostima</em> del giovane autore.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">✨ Focus sulla fantasia</h3>
            <p>
              Durante la fase creativa, l'interfaccia è volutamente <em>sobria</em>, senza immagini predefinite invasive. Solo al termine del racconto sarà possibile generare <strong>immagini, illustrazioni o brevi filmati</strong> grazie all'IA.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">👨‍👩‍👧‍👦 Un ponte tra adulti e bambini</h3>
            <p>
              Genitori, educatori e insegnanti partecipano come <em>facilitatori</em>. Lo strumento non sostituisce la relazione educativa, ma la <strong>arricchisce</strong>.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">🚀 Esplorazioni successive</h3>
            <p>Al termine di ogni storia, l'app permette di:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Esportare e conservare</strong> il testo</li>
              <li>Raccogliere racconti in un <em>archivio personalizzato</em></li>
              <li><strong>Tradurre</strong> la storia in inglese</li>
              <li>Generare <em>contenuti visivi o audiovisivi</em></li>
              <li><strong>Condividere</strong> la storia con altri bambini</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">🎭 Creatività condivisa</h3>
            <p>
              I bambini potranno partecipare anche a <strong>laboratori e attività di gruppo</strong>, sia in presenza che a distanza.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">📖 Origine del nome</h3>
            <p>
              <strong>"FANTAS-Mia"</strong> nasce da <em>"FANTASIA MIA"</em>, richiamo alla libertà di pensiero e alla proprietà dell'opera. Il suono evoca anche <em>"fantasma"</em>, collegandosi a una modalità creativa dell'app.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;