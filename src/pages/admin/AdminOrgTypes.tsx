import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { 
  getOrgTypes, 
  saveOrgType, 
  deleteOrgType,
  getSUUsers,
  type AdminOrgType
} from '@/utils/adminStorage';

const AdminOrgTypes = () => {
  const { toast } = useToast();
  
  const [orgTypes, setOrgTypes] = useState<AdminOrgType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AdminOrgType | null>(null);
  const [typeName, setTypeName] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrgTypes();
      // Sort alphabetically
      data.sort((a, b) => a.name.localeCompare(b.name));
      setOrgTypes(data);
    } catch (error) {
      console.error('Error loading org types:', error);
      toast({ title: 'Errore', description: 'Impossibile caricare i tipi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingType(null);
    setTypeName('');
    setIsDialogOpen(true);
  };

  const handleEdit = (orgType: AdminOrgType) => {
    setEditingType(orgType);
    setTypeName(orgType.name);
    setIsDialogOpen(true);
  };

  const handleDelete = async (orgType: AdminOrgType) => {
    // Check if any SU is using this type
    const users = await getSUUsers();
    const usersUsingType = users.filter(u => u.organizationType === orgType.name);
    
    if (usersUsingType.length > 0) {
      toast({ 
        title: 'Impossibile eliminare', 
        description: `Questo tipo è usato da ${usersUsingType.length} SuperUser`,
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Eliminare il tipo "${orgType.name}"?`)) return;
    
    try {
      await deleteOrgType(orgType.id);
      toast({ title: 'Eliminato', description: `Tipo "${orgType.name}" eliminato` });
      loadData();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    const trimmedName = typeName.trim().toLowerCase();
    
    if (!trimmedName) {
      toast({ title: 'Errore', description: 'Il nome è obbligatorio', variant: 'destructive' });
      return;
    }

    // Check for duplicates (excluding current if editing)
    const isDuplicate = orgTypes.some(
      t => t.name.toLowerCase() === trimmedName && t.id !== editingType?.id
    );
    
    if (isDuplicate) {
      toast({ title: 'Errore', description: 'Questo tipo esiste già', variant: 'destructive' });
      return;
    }

    try {
      const orgType: AdminOrgType = {
        id: editingType?.id || crypto.randomUUID(),
        name: trimmedName,
        createdAt: editingType?.createdAt || new Date().toISOString()
      };
      
      await saveOrgType(orgType);
      toast({ 
        title: editingType ? 'Modificato' : 'Creato',
        description: `Tipo "${trimmedName}" salvato`
      });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout 
      title="Tipi Organizzazione"
      subtitle="Gestisci la lista dei tipi di organizzazione per i SuperUser"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Tipo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Tipi Organizzazione ({orgTypes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Caricamento...</div>
            ) : orgTypes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nessun tipo. Creane uno nuovo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data creazione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgTypes.map((orgType) => (
                    <TableRow key={orgType.id}>
                      <TableCell className="font-medium capitalize">{orgType.name}</TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(orgType.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(orgType)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(orgType)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Modifica Tipo' : 'Nuovo Tipo Organizzazione'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="es. biblioteca, scuola, oratorio..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
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

export default AdminOrgTypes;
