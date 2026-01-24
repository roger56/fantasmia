import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Lock, Check, X, Eye, EyeOff, ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  updateNSUPassword, 
  checkPasswordRequirements, 
  isPasswordStrong,
  ExtendedProfile 
} from '@/utils/nsuManager';
import { setCurrentProfileId } from '@/utils/profileManager';
import { AuthBridge } from '@/utils/authBridge';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { getOneTimeSession, isOneTimeSessionActive } from '@/utils/oneTimeTokenManager';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { profileId, profile } = (location.state as { 
    profileId?: string; 
    profile?: ExtendedProfile 
  }) || {};
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // 🛡️ GUARD OT MODE: Blocca completamente utenti one-time
  useEffect(() => {
    const otSession = getOneTimeSession();
    if (otSession && isOneTimeSessionActive()) {
      console.log('🛡️ ChangePassword: OT session detected, blocking access');
      toast({
        title: "Operazione non disponibile",
        description: "Il cambio password non è disponibile in accesso temporaneo",
        variant: "destructive"
      });
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Redirect if no profile
    if (!profileId) {
      navigate('/profiles');
    }
  }, [profileId, navigate, toast]);

  // Update requirements as user types
  useEffect(() => {
    setRequirements(checkPasswordRequirements(newPassword));
  }, [newPassword]);

  const getPasswordStrength = (): number => {
    const fulfilled = Object.values(requirements).filter(Boolean).length;
    return (fulfilled / 5) * 100;
  };

  const getStrengthLabel = (): string => {
    const strength = getPasswordStrength();
    if (strength <= 20) return 'Molto debole';
    if (strength <= 40) return 'Debole';
    if (strength <= 60) return 'Discreta';
    if (strength <= 80) return 'Buona';
    return 'Ottima';
  };

  const getStrengthColor = (): string => {
    const strength = getPasswordStrength();
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Errore',
        description: 'Le password non coincidono',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isPasswordStrong(newPassword)) {
      toast({
        title: 'Errore',
        description: 'La password non rispetta tutti i requisiti di sicurezza',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateNSUPassword(profileId!, newPassword);
      
      toast({
        title: 'Successo',
        description: 'Password aggiornata con successo',
      });
      
      // Set profile and navigate to dashboard
      if (profile) {
        setCurrentProfileId(profile.id);
        AuthBridge.createLocalSupabaseSession({
          id: profile.id,
          name: profile.name,
          password: newPassword,
          age: 10
        });
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare la password',
        variant: 'destructive',
      });
    }
    
    setIsSubmitting(false);
  };

  const RequirementItem = ({ 
    met, 
    label 
  }: { 
    met: boolean; 
    label: string 
  }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-slate-500'}`}>
      {met ? (
        <Check className="h-4 w-4" />
      ) : (
        <X className="h-4 w-4" />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />
      
      {/* Fixed Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profiles')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          <h1 className="text-xl font-bold text-slate-800">Cambio Password</h1>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profiles')}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto pt-24">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Imposta nuova password</CardTitle>
            <CardDescription>
              Per la sicurezza del tuo account, devi impostare una nuova password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Alert>
                <AlertDescription>
                  {profile?.name && (
                    <span>
                      Profilo: <strong>{profile.name}</strong>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
              
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova password</Label>
                <div className="relative">
                  {/* SECURITY: passwords must never be stored client-side */}
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Inserisci nuova password"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={getPasswordStrength()} 
                        className="flex-1 h-2"
                      />
                      <span className={`text-xs font-medium ${getStrengthColor().replace('bg-', 'text-')}`}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma la password"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">Le password non coincidono</p>
                )}
              </div>
              
              {/* Requirements checklist */}
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Requisiti password:
                </p>
                <RequirementItem 
                  met={requirements.minLength} 
                  label="Almeno 8 caratteri" 
                />
                <RequirementItem 
                  met={requirements.hasUppercase} 
                  label="Una lettera maiuscola" 
                />
                <RequirementItem 
                  met={requirements.hasLowercase} 
                  label="Una lettera minuscola" 
                />
                <RequirementItem 
                  met={requirements.hasNumber} 
                  label="Un numero" 
                />
                <RequirementItem 
                  met={requirements.hasSpecialChar} 
                  label="Un carattere speciale (!@#$%...)" 
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  !isPasswordStrong(newPassword) ||
                  newPassword !== confirmPassword
                }
              >
                {isSubmitting ? 'Salvataggio...' : 'Salva nuova password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
