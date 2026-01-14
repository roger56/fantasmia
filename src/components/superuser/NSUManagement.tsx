import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreVertical,
  UserPlus,
  Users,
  Settings,
  RefreshCw,
  Trash2,
  Ban,
  CheckCircle,
  Key,
  Calendar,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PasswordRevealCard from '@/components/shared/PasswordRevealCard';
import {
  ExtendedProfile,
  SUSettings,
  CreateNSUPayload,
  createNSU,
  getNSUProfilesBySU,
  countActiveNSU,
  getSUSettingsWithDefaults,
  saveSUSettings,
  disableNSU,
  enableNSU,
  deleteNSU,
  resetNSUPassword,
  cleanupExpiredProfiles,
  cleanupInactiveProfiles,
  isPasswordStrong,
} from '@/utils/nsuManager';

const NSUManagement: React.FC = () => {
  const { toast } = useToast();
  const [nsuList, setNsuList] = useState<ExtendedProfile[]>([]);
  const [settings, setSettings] = useState<SUSettings | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialogs state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPasswordReveal, setShowPasswordReveal] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Create form state
  const [newNsuName, setNewNsuName] = useState('');
  const [newNsuPassword, setNewNsuPassword] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profiles, suSettings, count] = await Promise.all([
        getNSUProfilesBySU('superuser'),
        getSUSettingsWithDefaults(),
        countActiveNSU('superuser'),
      ]);
      
      setNsuList(profiles);
      setSettings(suSettings);
      setActiveCount(count);
    } catch (error) {
      console.error('Error loading NSU data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati NSU',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleCreateNSU = async () => {
    if (!newNsuName.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci un nome per il profilo',
        variant: 'destructive',
      });
      return;
    }

    if (!useGeneratedPassword && newNsuPassword && !isPasswordStrong(newNsuPassword)) {
      toast({
        title: 'Errore',
        description: 'La password deve avere almeno 8 caratteri, maiuscole, minuscole, numeri e caratteri speciali',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload: CreateNSUPayload = {
        name: newNsuName.trim(),
        password: useGeneratedPassword ? undefined : newNsuPassword,
        isTemporary,
        expiryDays: isTemporary ? expiryDays : undefined,
        notes: notes.trim() || undefined,
      };

      const result = await createNSU('superuser', payload);
      
      toast({
        title: 'Successo',
        description: `Profilo "${result.profile.name}" creato`,
      });

      // Show generated password
      if (result.generatedPassword) {
        setShowPasswordReveal(result.generatedPassword);
      }

      // Reset form and reload
      setNewNsuName('');
      setNewNsuPassword('');
      setIsTemporary(false);
      setExpiryDays(7);
      setNotes('');
      setUseGeneratedPassword(true);
      setShowCreateDialog(false);
      
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare il profilo',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (profile: ExtendedProfile) => {
    try {
      if (profile.status === 'active') {
        await disableNSU(profile.id);
        toast({ title: 'Profilo disabilitato' });
      } else {
        await enableNSU(profile.id);
        toast({ title: 'Profilo abilitato' });
      }
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (profileId: string) => {
    try {
      const newPassword = await resetNSUPassword(profileId);
      setShowPasswordReveal(newPassword);
      toast({ title: 'Password resettata' });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNSU = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await deleteNSU(deleteConfirmId);
      toast({ title: 'Profilo eliminato' });
      setDeleteConfirmId(null);
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      await saveSUSettings(settings);
      toast({ title: 'Impostazioni salvate' });
      setShowSettingsDialog(false);
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCleanup = async () => {
    try {
      const expiredCount = await cleanupExpiredProfiles();
      const inactiveCount = await cleanupInactiveProfiles('superuser');
      
      if (expiredCount > 0 || inactiveCount > 0) {
        toast({
          title: 'Pulizia completata',
          description: `Rimossi ${expiredCount} scaduti, ${inactiveCount} inattivi`,
        });
        await loadData();
      } else {
        toast({ title: 'Nessun profilo da rimuovere' });
      }
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const isExpired = (profile: ExtendedProfile) => {
    if (!profile.expires_at) return false;
    return new Date(profile.expires_at) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestione NSU
          </h2>
          <p className="text-muted-foreground">
            Gestisci i profili utente (Non-Superuser)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={activeCount >= (settings?.max_nsu || 20) ? 'destructive' : 'secondary'}>
            {activeCount} / {settings?.max_nsu || 20} attivi
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleCleanup}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create button */}
      <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
        <UserPlus className="h-4 w-4 mr-2" />
        Crea nuovo NSU
      </Button>

      {/* NSU List */}
      <Card>
        <CardHeader>
          <CardTitle>Profili NSU</CardTitle>
          <CardDescription>
            {nsuList.length === 0
              ? 'Nessun profilo NSU creato'
              : `${nsuList.length} profili trovati`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nsuList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nessun profilo NSU creato</p>
              <p className="text-sm">Clicca "Crea nuovo NSU" per iniziare</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="hidden md:table-cell">Ultimo accesso</TableHead>
                  <TableHead className="hidden md:table-cell">Scadenza</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nsuList.map((nsu) => (
                  <TableRow key={nsu.id} className={isExpired(nsu) ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{nsu.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          nsu.status === 'active' && !isExpired(nsu)
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {isExpired(nsu) ? 'Scaduto' : nsu.status === 'active' ? 'Attivo' : 'Disabilitato'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(nsu.last_login_at || nsu.last_access)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {nsu.expires_at ? (
                        <span className={isExpired(nsu) ? 'text-destructive' : ''}>
                          {formatDate(nsu.expires_at)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem onClick={() => handleToggleStatus(nsu)}>
                            {nsu.status === 'active' ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Disabilita
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Abilita
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(nsu.id)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirmId(nsu.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crea nuovo NSU</DialogTitle>
            <DialogDescription>
              Crea un nuovo profilo utente con password dedicata
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nsu-name">Nome profilo</Label>
              <Input
                id="nsu-name"
                value={newNsuName}
                onChange={(e) => setNewNsuName(e.target.value)}
                placeholder="Es. Mario Rossi"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="generate-pwd">Genera password automatica</Label>
              <Switch
                id="generate-pwd"
                checked={useGeneratedPassword}
                onCheckedChange={setUseGeneratedPassword}
              />
            </div>

            {!useGeneratedPassword && (
              <div>
                <Label htmlFor="nsu-password">Password</Label>
                <Input
                  id="nsu-password"
                  type="password"
                  value={newNsuPassword}
                  onChange={(e) => setNewNsuPassword(e.target.value)}
                  placeholder="Min 8 caratteri, maiuscole, numeri, simboli"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="temporary">Profilo temporaneo</Label>
                <p className="text-xs text-muted-foreground">
                  Il profilo scadrà automaticamente
                </p>
              </div>
              <Switch
                id="temporary"
                checked={isTemporary}
                onCheckedChange={setIsTemporary}
              />
            </div>

            {isTemporary && (
              <div>
                <Label htmlFor="expiry-days">Giorni di validità</Label>
                <Input
                  id="expiry-days"
                  type="number"
                  min={1}
                  max={365}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note sul profilo..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateNSU}>
              <Plus className="h-4 w-4 mr-2" />
              Crea NSU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Impostazioni NSU</DialogTitle>
            <DialogDescription>
              Configura i limiti e le regole per i profili NSU
            </DialogDescription>
          </DialogHeader>

          {settings && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="max-nsu">Numero massimo NSU attivi</Label>
                <Input
                  id="max-nsu"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.max_nsu}
                  onChange={(e) =>
                    setSettings({ ...settings, max_nsu: parseInt(e.target.value) || 20 })
                  }
                />
              </div>

              <div>
                <Label htmlFor="default-expiry">Scadenza default (giorni)</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Per profili temporanei. 0 = nessuna scadenza
                </p>
                <Input
                  id="default-expiry"
                  type="number"
                  min={0}
                  max={365}
                  value={settings.default_nsu_expiry_days}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_nsu_expiry_days: parseInt(e.target.value) || 7,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="cleanup-days">Pulizia inattivi dopo (giorni)</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Profili senza accesso vengono rimossi automaticamente
                </p>
                <Input
                  id="cleanup-days"
                  type="number"
                  min={7}
                  max={365}
                  value={settings.auto_cleanup_inactive_days}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auto_cleanup_inactive_days: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveSettings}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reveal Dialog */}
      <PasswordRevealCard
        password={showPasswordReveal}
        onClose={() => setShowPasswordReveal(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo profilo? Questa azione è irreversibile e
              tutti i dati associati verranno persi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNSU}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NSUManagement;
