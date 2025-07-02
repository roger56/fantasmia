import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Key, BookOpen } from 'lucide-react';
import { getUsers, getStories } from '@/utils/userStorage';
import HomeButton from '@/components/HomeButton';

const SuperuserUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const allUsers = getUsers();
    const allStories = getStories();
    
    setUsers(allUsers);
    
    // Calculate story count for each user
    const stats: {[key: string]: number} = {};
    allUsers.forEach(user => {
      stats[user.id] = allStories.filter(story => story.authorId === user.id).length;
    });
    setUserStats(stats);
  }, []);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-800">
                        {user.name}
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700">Password:</span>
                    <span className="text-slate-600 font-mono">
                      {'•'.repeat(Math.min(user.password?.length || 0, 8))}
                    </span>
                  </div>
                  
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">Email:</span>
                      <span className="text-slate-600 truncate">{user.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700">Favole create:</span>
                    <span className="text-slate-600 font-semibold">
                      {userStats[user.id] || 0}
                    </span>
                  </div>
                  
                  {user.lastAccess && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Ultimo accesso:</span>
                      <p className="text-slate-600">
                        {new Date(user.lastAccess).toLocaleDateString()} alle{' '}
                        {new Date(user.lastAccess).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                  
                  {user.unreadMessages && user.unreadMessages.length > 0 && (
                    <div className="text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {user.unreadMessages.length} messaggi non letti
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperuserUsers;