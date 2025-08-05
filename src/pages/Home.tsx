
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Globe, BookOpen } from 'lucide-react';
import { initializeDirectoryStructureForExistingUsers, getUserById, markMessagesAsRead } from '@/utils/userStorage';
import MessageDialog from '@/components/shared/MessageDialog';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Inizializza la struttura directory per gli utenti esistenti
    initializeDirectoryStructureForExistingUsers();
    
    // Check for user from navigation state
    const userId = location.state?.userId;
    if (userId) {
      setCurrentUserId(userId);
      const user = getUserById(userId);
      if (user && user.unreadMessages && user.unreadMessages.length > 0) {
        const unread = user.unreadMessages.filter(m => !m.read);
        if (unread.length > 0) {
          setUnreadMessages(unread);
          setShowMessageDialog(true);
        }
      }
    }
  }, [location.state]);

  const handleMarkMessagesAsRead = () => {
    if (currentUserId) {
      markMessagesAsRead(currentUserId);
      setUnreadMessages([]);
      // Navigate to dashboard after reading messages
      navigate('/dashboard', { 
        state: { 
          profileId: currentUserId, 
          profileName: location.state?.profileName 
        } 
      });
    }
  };

  const mainOptions = [
    {
      id: 'profiles',
      title: 'Accedi ai Profili',
      icon: Users,
      description: 'Seleziona un profilo esistente o creane uno nuovo',
      path: '/profiles'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 px-[12px] py-[12px]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8 py-[12px]">
          <h1 className="text-4xl font-bold mb-2 text-red-500">FANTAS(m)IA</h1>
          <p className="text-lg text-sky-600">usa la tua FANTASIA FANTASMAGORICA</p>
        </div>

        {/* Main Options Grid */}
        <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto">
          {mainOptions.map(option => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={option.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-8 text-center py-[18px] px-[18px]">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Message Dialog */}
        <MessageDialog
          messages={unreadMessages}
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          onMarkAsRead={handleMarkMessagesAsRead}
        />
      </div>
    </div>
  );
};

export default Home;
