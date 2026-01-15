import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Link, Loader2, Clock, User, Tag } from 'lucide-react';
import { createOneTimeLink, CreateLinkResult } from '@/utils/oneTimeTokenManager';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminOneTimeLinks = () => {
  const [ttlHours, setTtlHours] = useState(5);
  const [username, setUsername] = useState('');
  const [label, setLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateLinkResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    setResult(null);

    const res = await createOneTimeLink(
      ttlHours,
      username.trim() || undefined,
      label.trim() || undefined
    );

    setIsLoading(false);
    setResult(res);

    if (res.success) {
      toast({ title: "Link creato", description: `Valido per ${ttlHours} ore` });
    } else {
      toast({ title: "Errore", description: res.error, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (result?.link) {
      navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copiato!" });
    }
  };

  const resetForm = () => {
    setResult(null);
    setUsername('');
    setLabel('');
    setTtlHours(5);
  };

  return (
    <AdminLayout 
      title="NSU One-Time Links"
      subtitle="Crea link di accesso temporaneo per utenti ospiti"
    >
      <div className="max-w-2xl space-y-6">
        {/* Form creazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Crea nuovo link
            </CardTitle>
            <CardDescription>
              L'utente potrà accedere senza password. La sessione scadrà dopo il tempo impostato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* TTL Slider */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label>Durata sessione: <strong>{ttlHours} ore</strong></Label>
              </div>
              <Slider
                value={[ttlHours]}
                onValueChange={(v) => setTtlHours(v[0])}
                min={1}
                max={24}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                L'invito scade se non usato entro 12 ore dalla creazione
              </p>
            </div>

            {/* Username (opzionale) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="username">Nome utente (opzionale)</Label>
              </div>
              <Input
                id="username"
                placeholder="Es. Ospite Demo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Se vuoto, verrà generato automaticamente
              </p>
            </div>

            {/* Label (opzionale) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="label">Etichetta (opzionale)</Label>
              </div>
              <Input
                id="label"
                placeholder="Es. Demo cliente ABC"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={50}
              />
            </div>

            <Button 
              onClick={handleCreate} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creazione...</>
              ) : (
                <><Link className="w-4 h-4 mr-2" /> Crea link one-time</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Risultato */}
        {result?.success && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6 space-y-4">
              <Alert className="border-green-300 bg-green-100">
                <AlertDescription className="text-green-800">
                  Link creato per <strong>{result.username}</strong> — valido {result.ttlHours} ore
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Link da condividere:</Label>
                <div className="flex gap-2">
                  <Input
                    value={result.link}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button variant="outline" onClick={handleCopy} className="shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                ⏳ Invito scade: {new Date(result.inviteExpiresAt!).toLocaleString('it-IT')}
              </p>

              <Button variant="outline" onClick={resetForm} className="w-full">
                Crea un altro link
              </Button>
            </CardContent>
          </Card>
        )}

        {result && !result.success && (
          <Alert variant="destructive">
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Come funziona:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Crea un link e invialo all'utente (email, chat, ecc.)</li>
              <li>L'utente clicca il link e accede immediatamente senza password</li>
              <li>La sessione dura il tempo impostato, poi scade automaticamente</li>
              <li>Ogni link può essere usato una sola volta</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOneTimeLinks;
