import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const IntroductoryScreens = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    } else {
      navigate("/home");
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  const screens = [
    {
      title: "Educazione alla Creatività – Introduzione a FANTAS(M)IA",
      content: `FANTAS(M)IA è un'app educativa progettata per accompagnare bambini e bambine nello sviluppo della propria immaginazione narrativa, in modo libero, coinvolgente e personalizzato.

Racconto a voce: grazie al riconoscimento vocale (STT – Speech to Text), i bambini possono raccontare con la propria voce ogni parte della loro storia, senza il vincolo della scrittura, sviluppando al contempo espressione orale, costruzione logica e senso narrativo.

Ascolto attivo: con la funzione Text-to-Speech (TTS), ogni storia può essere riascoltata. La voce sintetica restituisce al bambino l'intero testo letto ad alta voce, favorendo la comprensione del racconto e rafforzando l'autostima del giovane autore.

Focus sulla fantasia: durante la fase creativa, l'interfaccia è volutamente sobria, priva di immagini predefinite o animazioni invadenti. L'attenzione resta centrata sulla costruzione della storia. Solo al termine del racconto, sarà possibile generare immagini, illustrazioni o brevi filmati grazie all'intelligenza artificiale, ispirati ai contenuti ideati dal bambino.

Un ponte tra adulti e bambini: genitori, educatori e insegnanti sono invitati a partecipare come facilitatori e accompagnatori. Lo strumento non sostituisce la relazione educativa, ma la rafforza e l'arricchisce nella cooperazione e nella valorizzazione della creatività infantile.

Esplorazioni successive: al termine di ogni storia, l'app permette di:
- esportare e conservare il testo;
- raccogliere più racconti in un archivio personalizzato;
- tradurre la storia in inglese e confrontare le versioni;
- generare rappresentazioni visive o audiovisive del contenuto;
- condividere la storia con altri bambini (in forma pubblica o privata).

Creatività condivisa: bambini e bambine potranno partecipare – anche insieme – a laboratori in presenza, a distanza, attività ludiche inventive di gruppo, di classe, di ascolto, collaborazione e fantasia condivisa.

Il nome FANTAS(M)IA nasce da "FANTASIA MIA", richiamo alla libertà di pensiero e alla proprietà dell'opera narrativa: ogni bambino può dire "questa storia è mia!". Il suono evocativo di "fantasma" si ricollega anche a una delle modalità creative dell'app ("GHOST"), conferendo al nome un tono giocoso e multisignificativo.`
    },
    {
      title: "Privacy e accettazione delle condizioni d'uso",
      content: `PRIVACY

Grazie per aver scelto FANTASMIA, l'app dedicata ai bambini (affiancati da un adulto) per creare storie originali e fantasiose.

Per completare l'iscrizione e attivare il profilo, è necessario che l'adulto confermi la propria presa visione e accettazione delle condizioni d'uso dell'app, tra cui:

• La responsabilità dei contenuti creati dai bambini;
• La possibilità che le favole create da utenti non registrati o con profilo gratuito siano visibili pubblicamente;
• Il rispetto della normativa sulla privacy secondo GDPR (UE 2016/679).

👉 Cliccando sul link qui sotto, conferma l'iscrizione e accetta le condizioni indicate:

∞ Conferma iscrizione e accetta condizioni

(In caso il link non funzioni, può rispondere a questa email scrivendo:

"Confermo l'iscrizione e accetto le condizioni d'uso di FANTASMIA.")

Grazie per la fiducia!

Il Team di FANTASMIA

[www.FANTASMIA.it] | [inventastoria@gmail.com]`
    },
    {
      title: "Diritti d'autore",
      content: `1. Disclaimer legale sull'uso di contenuti ispirati a opere educative e narrative

L'app FANTASMIA si ispira a tecniche narrative e strumenti educativi provenienti da tre principali fonti tradizionali, culturali e didattiche orali:

- il metodo creativo descritto in "Grammatica della Fantasia" di Gianni Rodari (1973);
- le 31 funzioni di Propp, codificate nel saggio "Morfologia della fiaba" di Vladimir Propp (1928);
- le 12 tappe del Viaggio dell'Eroe secondo l'interpretazione narrativa di Joseph Campbell (e successivamente Vogler).

Tutti questi riferimenti vengono rielaborati da FANTASMIA in forma autonoma e creativa, senza riproduzione letterale, immediatamente riconoscibile dei contenuti protetti da diritto d'autore. La struttura e l'interfaccia dell'app sono originali, così come le modalità di interazione e le domande guidate.

2. Situazione legale delle fonti:

- L'opera Grammatica della Fantasia è tuttora protetta da diritto d'autore: Gianni Rodari è deceduto nel 1980, quindi la scadenza dei diritti è prevista per il 1° gennaio 2051, salvo proroghe;
- L'opera di Propp, pubblicata in URSS nel 1928, è di pubblico dominio in molti Paesi, tra cui l'Italia;
- Il Viaggio dell'Eroe di Campbell (1949) e le successive sintesi (es. Vogler) sono ancora coperte da copyright per i testi originali, ma le strutture narrative in sé sono considerate di dominio comune in ambito educativo e creativo.

3. Chiarezza d'intenti:

FANTASMIA non intende sostituirsi né affiliarsi agli autori citati né ai loro eredi/editori. L'uso di tali fonti ha finalità didattiche, formative e divulgative, ed è concepito come omaggio culturale al pensiero creativo e alla pedagogia narrativa.

Ogni contenuto dell'app è frutto di elaborazione indipendente e adattato per l'utilizzo sicuro e inclusivo da parte di bambini, famiglie, educatori e gruppi scolastici.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="min-h-[500px]">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
              {screens[currentPage].title}
            </h1>
            
            <ScrollArea className="h-80 w-full border rounded-lg p-4 bg-white">
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {screens[currentPage].content}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Page Indicators */}
        <div className="flex justify-center mt-6 mb-4">
          <div className="flex space-x-2">
            {screens.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentPage 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Vai alla pagina ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="px-8"
          >
            SALTA
          </Button>
          
          <Button
            onClick={handleNext}
            className="px-8"
          >
            AVANTI
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroductoryScreens;