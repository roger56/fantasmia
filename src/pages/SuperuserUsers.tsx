import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Copy, Eye, Key, Trash2, ChevronDown, Users, Search, RefreshCw, ChevronLeft, ChevronRight, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StoryLayout from '@/components/shared/StoryLayout';
import { hashPassword, generateSecurePassword, isPasswordStrong } from '@/utils/authSecurity';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';
import { enableNSU, disableNSU } from '@/utils/nsuManager';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  user_type: string;
  created_at: string;
  storyCount: number;
  stories: Array<{ id: string; title: string }>;
  status?: 'active' | 'disabled';
}

interface PasswordResetData {
  password: string;
  confirmPassword: string;
  isGenerated: boolean;
}

const SuperuserUsers = () => {
  const navigate = useNavigate();
  const { isChecking, isAuthorized } = useSuperuserGuard();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordResetData>({
    password: '',
    confirmPassword: '',
    isGenerated: false
  });
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.info('profiles-load:start');
      
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      await fantasMiaDB.init();
      
      // Carica tutti i profili ordinati per data creazione (desc)
      const profiles = await fantasMiaDB.getAllProfiles();
      const sortedProfiles = profiles.sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      
      // Per ogni profilo, conta le storie e carica i titoli usando Promise.all per efficienza
      const usersWithStats = await Promise.all(
        sortedProfiles.map(async (profile: any) => {
          const stories = await fantasMiaDB.getAMStoriesByOwner(profile.id);
          const storyTitles = stories
            .slice(0, 20) // Max 20 titoli
            .map((story: any) => ({ id: story.id, title: story.title || 'Senza titolo' }));
          
          return {
            id: profile.id,
            name: profile.name || 'Utente senza nome',
            email: profile.email || '',
            user_type: profile.user_type || 'user',
            created_at: profile.created_at || new Date().toISOString(),
            storyCount: stories.length,
            stories: storyTitles,
            status: (profile as any).status || 'active'
          };
        })
      );

      setUsers(usersWithStats);
      console.info('profiles-load:done', { count: usersWithStats.length });
    } catch (error) {
      console.error('❌ SUPERUSER-USERS: Errore caricamento utenti:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli utenti",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ============= NUOVA FUNZIONE: Crea Utente NSU =============
  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un nome per l'utente",
        variant: "destructive"
      });
      return;
    }

    // Controlla duplicati
    const existingUser = users.find(u => u.name.toLowerCase() === newUserName.trim().toLowerCase());
    if (existingUser) {
      toast({
        title: "Errore",
        description: `Esiste già un utente con nome "${newUserName}"`,
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      
      // Password standard NSU: due spazi
      const STANDARD_NSU_PASSWORD = "  ";
      const passwordHash = await hashPassword(STANDARD_NSU_PASSWORD);
      
      const now = new Date().toISOString();
      const newProfile = {
        id: crypto.randomUUID(),
        name: newUserName.trim(),
        created_at: now,
        last_access: now,
        user_type: 'user' as const,
        password_hash: passwordHash,
        status: 'active' as const,
        created_by_su_id: 'superuser'
      };
      
      await fantasMiaDB.saveProfile(newProfile);
      
      toast({
        title: "Utente creato",
        description: `Utente "${newUserName}" creato con successo. Password: due spazi`,
      });
      
      setShowCreateModal(false);
      setNewUserName('');
      await loadUsers();
      
      window.dispatchEvent(new CustomEvent('users:changed'));
      window.dispatchEvent(new CustomEvent('profiles:changed'));
      
    } catch (error) {
      console.error('❌ Errore creazione utente:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare l'utente",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ============= Toggle status utente =============
  const handleToggleStatus = async (user: UserProfile) => {
    if (user.user_type === 'superuser') {
      toast({
        title: "Operazione non consentita",
        description: "Non è possibile modificare lo stato di un superuser",
        variant: "destructive"
      });
      return;
    }

    try {
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      
      if (newStatus === 'disabled') {
        await disableNSU(user.id);
      } else {
        await enableNSU(user.id);
      }
      
      toast({
        title: newStatus === 'active' ? "Utente abilitato" : "Utente disabilitato",
        description: `${user.name} è ora ${newStatus === 'active' ? 'attivo' : 'disabilitato'}`,
      });
      
      await loadUsers();
      window.dispatchEvent(new CustomEvent('users:changed'));
      
    } catch (error) {
      console.error('❌ Errore toggle status:', error);
      toast({
        title: "Errore",
        description: "Impossibile modificare lo stato dell'utente",
        variant: "destructive"
      });
    }
  };

  const generateTempPassword = () => {
    const tempPassword = generateSecurePassword(12);
    setPasswordData({
      password: tempPassword,
      confirmPassword: tempPassword,
      isGenerated: true
    });
  };

  const handlePasswordReset = async () => {
    if (!selectedUser) return;

    // Validazione
    if (passwordData.password.length < 8) {
      toast({
        title: "Password troppo corta",
        description: "La password deve essere di almeno 8 caratteri",
        variant: "destructive"
      });
      return;
    }

    if (!isPasswordStrong(passwordData.password)) {
      toast({
        title: "Password non sicura",
        description: "La password deve contenere almeno 1 lettera maiuscola, 1 minuscola, 1 numero e 1 carattere speciale",
        variant: "destructive"
      });
      return;
    }

    if (!passwordData.isGenerated && passwordData.password !== passwordData.confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "La password e la conferma devono essere identiche",
        variant: "destructive"
      });
      return;
    }

    try {
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      const hashedPassword = await hashPassword(passwordData.password);
      
      // Aggiorna il profilo con la nuova password hash
      const updatedProfile = {
        id: selectedUser.id,
        name: selectedUser.name,
        created_at: selectedUser.created_at,
        last_access: new Date().toISOString(),
        email: selectedUser.email,
        user_type: selectedUser.user_type,
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      };
      
      await fantasMiaDB.saveProfile(updatedProfile);
      
      toast({
        title: "Password aggiornata",
        description: `Password aggiornata per ${selectedUser.name}`,
        variant: "default"
      });

      // Reset modal
      setShowPasswordModal(false);
      setPasswordData({ password: '', confirmPassword: '', isGenerated: false });
      setSelectedUser(null);
      
      // Emit event
      window.dispatchEvent(new CustomEvent('users:changed'));
      
    } catch (error) {
      console.error('❌ SUPERUSER-USERS: Errore reset password:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la password",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    // Impedire eliminazione superuser
    if (selectedUser.user_type === 'superuser') {
      toast({
        title: "Operazione non consentita",
        description: "Non è possibile eliminare un utente superuser",
        variant: "destructive"
      });
      return;
    }

    try {
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      const { deleteProfileFromAllSources } = await import('@/utils/profileSync');
      
      // Elimina tutte le storie dell'utente
      const userStories = await fantasMiaDB.getAMStoriesByOwner(selectedUser.id);
      for (const story of userStories) {
        await fantasMiaDB.deleteAMStory(story.id);
        // Elimina anche i media associati
        await fantasMiaDB.deleteMediaAssetsByStoryId(story.id);
      }
      
      // ✅ NUOVA LOGICA: Usa deleteProfileFromAllSources per eliminare da TUTTE le fonti
      await deleteProfileFromAllSources(selectedUser.id);
      
      // ✅ Forza aggiornamento backup per allineare lo snapshot
      try {
        const { persistenceManager } = await import('@/utils/persistenceManager');
        await persistenceManager.createBackup();
        console.log('✅ Backup aggiornato dopo cancellazione profilo');
      } catch (e) {
        console.warn('⚠️ Errore aggiornamento backup:', e);
      }
      
      toast({
        title: "Utente eliminato",
        description: `${selectedUser.name} e tutte le sue ${selectedUser.storyCount} storie sono stati eliminati`,
        variant: "default"
      });

      // Aggiorna la lista rimuovendo l'utente
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      // Reset modal
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      // Emit event
      window.dispatchEvent(new CustomEvent('users:changed'));
      
    } catch (error) {
      console.error('❌ SUPERUSER-USERS: Errore eliminazione utente:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'utente",
        variant: "destructive"
      });
    }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(passwordData.password);
    toast({
      title: "Password copiata",
      description: "Password temporanea copiata negli appunti",
    });
  };

  useEffect(() => {
    loadUsers();

    // Listen for user and profile changes
    const handleProfilesChanged = (event?: CustomEvent) => {
      if (event?.detail) {
        console.info('profiles:changed:event', event.detail);
      }
      loadUsers();
    };

    window.addEventListener('profiles:changed', handleProfilesChanged);
    window.addEventListener('users:changed', handleProfilesChanged);
    
    return () => {
      window.removeEventListener('profiles:changed', handleProfilesChanged);
      window.removeEventListener('users:changed', handleProfilesChanged);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter and paginate users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 🛡️ SECURITY: Spinner durante check autorizzazione
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <StoryLayout
        title="Gestione Utenti"
        subtitle="Caricamento utenti..."
        onBack={() => navigate('/superuser')}
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title="Gestione Utenti"
      subtitle={`${users.length} utenti registrati`}
      onBack={() => navigate('/superuser')}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lista Utenti
                </CardTitle>
                <CardDescription>
                  Gestisci password, visualizza storie ed elimina utenti
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Aggiungi Utente
              </Button>
            </div>
            
            {/* Search and controls */}
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cerca per nome o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadUsers}
                title="Ricarica elenco"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Creato il</TableHead>
                  <TableHead>Storie</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? `Nessun utente trovato per "${searchTerm}"` : 'Nessun utente registrato. Clicca "Aggiungi Utente" per crearne uno.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className={user.status === 'disabled' ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Attivo' : 'Disabilitato'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.user_type === 'superuser' ? 'default' : 'outline'}>
                          {user.user_type === 'superuser' ? 'SU' : 'NSU'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.storyCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Toggle Status */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            disabled={user.user_type === 'superuser'}
                            title={user.status === 'active' ? 'Disabilita' : 'Abilita'}
                          >
                            {user.status === 'active' ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowPasswordModal(true);
                            }}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            disabled={user.user_type === 'superuser'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          {user.stories.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="max-w-xs">
                                {user.stories.map((story) => (
                                  <DropdownMenuItem
                                    key={story.id}
                                    onClick={() => navigate(`/superuser-user-story-viewer/${story.id}`)}
                                    className="cursor-pointer"
                                  >
                                    <span className="truncate">{story.title}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} di {filteredUsers.length} utenti
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Reset Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password - {selectedUser?.name}</DialogTitle>
              <DialogDescription>
                Scegli come impostare la nuova password per l'utente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateTempPassword}
                  className="flex-1"
                >
                  Genera Password Temporanea
                </Button>
              </div>

              {passwordData.isGenerated && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label>Password generata:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={passwordData.password}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPasswordToClipboard}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Copia questa password per fornirla all'utente
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="manual-password">Oppure imposta manualmente:</Label>
                <Input
                  id="manual-password"
                  type="password"
                  placeholder="Nuova password (min 8 caratteri)"
                  value={passwordData.isGenerated ? '' : passwordData.password}
                  onChange={(e) => setPasswordData(prev => ({
                    password: e.target.value,
                    confirmPassword: prev.confirmPassword,
                    isGenerated: false
                  }))}
                />
              </div>

              {!passwordData.isGenerated && passwordData.password && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma password:</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Ripeti la password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handlePasswordReset}
                disabled={!passwordData.password}
              >
                Aggiorna Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                L'utente <strong>{selectedUser?.name}</strong> ha{' '}
                <strong>{selectedUser?.storyCount} storie</strong> associate.
                <br /><br />
                Eliminando l'utente verranno rimossi:
                <br />• Il profilo utente
                <br />• Tutte le {selectedUser?.storyCount} storie
                <br />• Tutti i media associati
                <br /><br />
                <strong>Questa operazione è irreversibile.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina tutto
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create User Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Utente</DialogTitle>
              <DialogDescription>
                Crea un nuovo utente NSU. La password standard è: due spazi (premere 2 volte la barra spaziatrice).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Nome utente</Label>
                <Input
                  id="new-user-name"
                  placeholder="Nome del nuovo utente"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                💡 <strong>Password standard:</strong> L'utente accederà digitando due spazi (barra spaziatrice × 2)
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={!newUserName.trim() || isCreating}
              >
                {isCreating ? 'Creazione...' : 'Crea Utente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StoryLayout>
  );
};

export default SuperuserUsers;