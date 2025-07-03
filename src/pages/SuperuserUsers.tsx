
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
    
    // Calculate story count for each user correctly
    const stats: {[key: string]: number} = {};
    allUsers.forEach(user => {
      const userStories = allStories.filter(story => story.authorId === user.id);
      stats[user.id] = userStories.length;
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperuserUsers;
