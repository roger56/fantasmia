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
import { Copy, Eye, Key, Trash2, ChevronDown, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StoryLayout from '@/components/shared/StoryLayout';
import { hashPassword, generateSecurePassword, isPasswordStrong } from '@/utils/authSecurity';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  user_type: string;
  created_at: string;
  storyCount: number;
  stories: Array<{ id: string; title: string }>;
}

interface PasswordResetData {
  password: string;
  confirmPassword: string;
  isGenerated: boolean;
}

const SuperuserUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordResetData>({
    password: '',
    confirmPassword: '',
    isGenerated: false
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      await fantasMiaDB.init();
      
      // Carica tutti i profili
      const profiles = await fantasMiaDB.getAllProfiles();
      
      // Per ogni profilo, conta le storie e carica i titoli
      const usersWithStats = await Promise.all(
        profiles.map(async (profile: any) => {
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
            stories: storyTitles
          };
        })
      );

      setUsers(usersWithStats);
      console.log('👥 SUPERUSER-USERS: Caricati', usersWithStats.length, 'utenti');
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
      
      // Elimina tutte le storie dell'utente
      const userStories = await fantasMiaDB.getAMStoriesByOwner(selectedUser.id);
      for (const story of userStories) {
        await fantasMiaDB.deleteAMStory(story.id);
        // Elimina anche i media associati
        await fantasMiaDB.deleteMediaAssetsByStoryId(story.id);
      }
      
      // Elimina il profilo
      await fantasMiaDB.deleteProfile(selectedUser.id);
      
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

    // Listen for user changes
    const handleUsersChanged = () => {
      loadUsers();
    };

    window.addEventListener('users:changed', handleUsersChanged);
    return () => window.removeEventListener('users:changed', handleUsersChanged);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista Utenti
            </CardTitle>
            <CardDescription>
              Gestisci password, visualizza storie ed elimina utenti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Creato il</TableHead>
                  <TableHead>Storie</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email || 'Non specificata'}</TableCell>
                    <TableCell>
                      <Badge variant={user.user_type === 'superuser' ? 'default' : 'secondary'}>
                        {user.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.storyCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                ))}
              </TableBody>
            </Table>
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
      </div>
    </StoryLayout>
  );
};

export default SuperuserUsers;