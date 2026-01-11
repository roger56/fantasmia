import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, UserX, UserCheck, RefreshCw, Users, Info } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { 
  getSUUsers, 
  saveSUUser, 
  getOrgTypes, 
  generatePassword,
  createNewSUUser,
  type AdminSUUser,
  type AdminOrgType
} from '@/utils/adminStorage';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminSUUsers = () => {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<AdminSUUser[]>([]);
  const [orgTypes, setOrgTypes] = useState<AdminOrgType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminSUUser | null>(null);
  const [formData, setFormData] = useState<AdminSUUser>(createNewSUUser());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, orgTypesData] = await Promise.all([
        getSUUsers(),
        getOrgTypes()
      ]);
      setUsers(usersData);
      setOrgTypes(orgTypesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Errore', description: 'Impossibile caricare i dati', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormData(createNewSUUser());
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleEdit = (user: AdminSUUser) => {
    setEditingUser(user);
    setFormData({ ...user });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (user: AdminSUUser) => {
    try {
      const updated = { 
        ...user, 
        isActive: !user.isActive,
        updatedAt: new Date().toISOString()
      };
      await saveSUUser(updated);
      toast({ 
        title: user.isActive ? 'Disattivato' : 'Riattivato',
        description: `SuperUser ${user.username} ${user.isActive ? 'disattivato' : 'riattivato'}`
      });
      loadData();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  const handleRegeneratePassword = () => {
    setFormData(prev => ({ ...prev, initialPassword: generatePassword() }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username obbligatorio';
    }
    if (!formData.cell.trim()) {
      newErrors.cell = 'Cellulare obbligatorio';
    } else if (!/^\+?[\d\s-]{8,}$/.test(formData.cell)) {
      newErrors.cell = 'Formato cellulare non valido';
    }
    if (!formData.mail.trim()) {
      newErrors.mail = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
      newErrors.mail = 'Formato email non valido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const userToSave = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      await saveSUUser(userToSave);
      toast({ 
        title: editingUser ? 'Modificato' : 'Creato',
        description: `SuperUser ${formData.username} salvato con successo`
      });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare', variant: 'destructive' });
    }
  };

  const getContractBadgeColor = (contract: string) => {
    switch (contract) {
      case 'Free': return 'bg-slate-100 text-slate-700';
      case 'Family': return 'bg-blue-100 text-blue-700';
      case 'Fantasy': return 'bg-purple-100 text-purple-700';
      default: return '';
    }
  };

  return (
    <AdminLayout 
      title="Gestione SuperUser (SU)"
      subtitle="Crea e gestisci gli account SuperUser del sistema"
    >
      <div className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Le password iniziali vengono generate automaticamente e devono essere consegnate manualmente fuori sistema.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between items-center">
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo SuperUser
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              SuperUser ({users.filter(u => u.isActive).length} attivi / {users.length} totali)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Caricamento...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nessun SuperUser. Creane uno nuovo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Contatti</TableHead>
                      <TableHead>Organizzazione</TableHead>
                      <TableHead>Contratto</TableHead>
                      <TableHead className="text-center">Max NSU</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.mail}</div>
                            <div className="text-slate-500">{user.cell}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.organizationType && <div>{user.organizationType}</div>}
                            {user.cei && <div className="text-slate-500">CEI: {user.cei}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getContractBadgeColor(user.contract3F)}>
                            {user.contract3F}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{user.maxNSU}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Attivo' : 'Disattivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4 text-red-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? `Modifica: ${editingUser.username}` : 'Nuovo SuperUser'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="nome_utente"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password iniziale</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.initialPassword}
                  readOnly
                  className="font-mono bg-slate-50"
                />
                <Button type="button" variant="outline" onClick={handleRegeneratePassword}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">Generata automaticamente. Consegnare manualmente.</p>
            </div>

            {/* Cell */}
            <div className="space-y-2">
              <Label htmlFor="cell">Cellulare *</Label>
              <Input
                id="cell"
                value={formData.cell}
                onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                placeholder="+39 333 1234567"
                className={errors.cell ? 'border-red-500' : ''}
              />
              {errors.cell && <p className="text-sm text-red-500">{errors.cell}</p>}
            </div>

            {/* Mail */}
            <div className="space-y-2">
              <Label htmlFor="mail">Email *</Label>
              <Input
                id="mail"
                type="email"
                value={formData.mail}
                onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                placeholder="email@esempio.com"
                className={errors.mail ? 'border-red-500' : ''}
              />
              {errors.mail && <p className="text-sm text-red-500">{errors.mail}</p>}
            </div>

            {/* CEI */}
            <div className="space-y-2">
              <Label htmlFor="cei">CEI (opzionale)</Label>
              <Input
                id="cei"
                value={formData.cei || ''}
                onChange={(e) => setFormData({ ...formData, cei: e.target.value })}
                placeholder="Codice CEI"
              />
            </div>

            {/* Organization Type */}
            <div className="space-y-2">
              <Label>Tipo Organizzazione (opzionale)</Label>
              <Select
                value={formData.organizationType || ''}
                onValueChange={(value) => setFormData({ ...formData, organizationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuna</SelectItem>
                  {orgTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contract 3F */}
            <div className="space-y-2">
              <Label>Contratto 3F</Label>
              <Select
                value={formData.contract3F}
                onValueChange={(value: 'Free' | 'Family' | 'Fantasy') => 
                  setFormData({ ...formData, contract3F: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max NSU */}
            <div className="space-y-2">
              <Label htmlFor="maxNSU">Numero massimo NSU</Label>
              <Input
                id="maxNSU"
                type="number"
                min={1}
                max={1000}
                value={formData.maxNSU}
                onChange={(e) => setFormData({ ...formData, maxNSU: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-slate-500">Solo memorizzazione, nessun enforcement runtime.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSUUsers;
