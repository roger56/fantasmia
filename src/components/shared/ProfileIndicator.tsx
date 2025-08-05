import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';

const ProfileIndicator: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (authStatus.authenticated && authStatus.userName) {
        setUserName(authStatus.userName);
      }
    };

    checkUser();
  }, []);

  if (!userName) return null;

  return (
    <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm z-40">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <User className="w-4 h-4" />
        <span className="font-medium">Profilo: {userName}</span>
      </div>
    </div>
  );
};

export default ProfileIndicator;