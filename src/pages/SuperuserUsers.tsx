
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, User, Mail, Key, BookOpen, Edit, Trash2 } from 'lucide-react';
import { getUsers, getStories, updateUser, getAllStoriesForSuperuser } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<{[key: string]: number}>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const allUsers = getUsers();
      const allStories = await getAllStoriesForSuperuser();
      
      setUsers(allUsers);
      
      // Calculate story count for each user correctly using authorId
      const stats: {[key: string]: number} = {};
      allUsers.forEach(user => {
        const userStories = allStories.filter(story => story.authorId === user.id);
        stats[user.id] = userStories.length;
      });
      setUserStats(stats);
    };
    
    fetchData();
  }, []);

  const handlePasswordChange = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsDialogOpen(true);
  };

  const handlePasswordUpdate = () => {
    if (!newPassword.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci una nuova password",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive"
      });
      return;
    }

    // Update user password
    const updatedUser = { ...selectedUser, password: newPassword };
    updateUser(updatedUser);
    
    // Update local state
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
    
    toast({
      title: "Password aggiornata",
      description: `Password di ${selectedUser.name} aggiornata con successo`,
    });

    setIsDialogOpen(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      // Get all users and remove the selected one
      const allUsers = getUsers();
      const updatedUsers = allUsers.filter(u => u.id !== userToDelete.id);
      localStorage.setItem('fantasmia_users', JSON.stringify(updatedUsers));
      
      // Update local state
      setUsers(updatedUsers);
      
      // Recalculate stats
      const allStories = await getAllStoriesForSuperuser();
      const stats: {[key: string]: number} = {};
      updatedUsers.forEach(user => {
        const userStories = allStories.filter(story => story.authorId === user.id);
        stats[user.id] = userStories.length;
      });
      setUserStats(stats);
      
      toast({
        title: "Utente eliminato",
        description: `${userToDelete.name} è stato eliminato con successo`,
      });
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestione Utenti</h1>
              <p className="text-slate-600">Visualizza tutti i profili utente</p>
            </div>
          </div>
        </div>

        {users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Nessun utente trovato
              </h3>
              <p className="text-slate-600">
                Non ci sono ancora utenti registrati
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm flex-shrink-0">
                        <Key className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-600">{user.password || 'N/A'}</span>
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm flex-shrink-0">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-600 truncate max-w-32">{user.email}</span>
                        </div>
                      )}
                       <div className="flex items-center gap-2 text-sm flex-shrink-0">
                         <BookOpen className="w-3 h-3 text-slate-500" />
                         <span className="font-semibold text-slate-800">{userStats[user.id] || 0}</span>
                       </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePasswordChange(user);
                          }}
                          className="ml-2"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user);
                          }}
                          className="ml-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Password Change Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Modifica Password - {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nuova Password
                </label>
                <Input
                  type="password"
                  placeholder="Inserisci nuova password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conferma Password
                </label>
                <Input
                  type="password"
                  placeholder="Conferma nuova password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={handlePasswordUpdate}
                  className="flex-1"
                >
                  Aggiorna Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Conferma Eliminazione</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-700">
                Sei sicuro di voler eliminare l'utente <strong>{userToDelete?.name}</strong>?
              </p>
              <p className="text-sm text-red-600">
                Questa azione non può essere annullata.
              </p>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={confirmDeleteUser}
                  variant="destructive"
                  className="flex-1"
                >
                  Elimina
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperuserUsers;
