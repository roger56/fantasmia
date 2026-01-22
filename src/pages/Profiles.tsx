import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Lock, Shield, Home } from "lucide-react";
import { authenticateUser } from "@/utils/userStorage";
import { AuthBridge } from "@/utils/authBridge";
import { setCurrentProfileId, clearCurrentProfile } from "@/utils/profileManager";
import { loadProfilesUnified, SyncedProfile } from "@/utils/profileSync";
import { useToast } from "@/hooks/use-toast";
import ProfileIndicator from "@/components/shared/ProfileIndicator";
import { authenticateNSU, cleanupExpiredProfiles, cleanupInactiveProfiles } from "@/utils/nsuManager";
import { getOneTimeSession, isOneTimeSessionActive } from "@/utils/oneTimeTokenManager";

const Profiles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  // ✅ REQUISITO 2: Stato di loading bloccante durante caricamento profili
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  useEffect(() => {
    // 🛡️ GUARD OT MODE: Se in sessione one-time, redirect immediato a dashboard
    const otSession = getOneTimeSession();
    if (otSession && isOneTimeSessionActive()) {
      console.log("🛡️ Profiles: OT session detected, redirecting to dashboard");
      toast({
        title: "Accesso non consentito",
        description: "La selezione profili non è disponibile in accesso temporaneo",
        variant: "destructive",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    // 🛡️ SECURITY: Pulisci history aggressivamente per evitare back verso pagine protette
    window.history.replaceState(null, "", "/profiles");

    // PULIZIA COMPLETA: azzera TUTTE le sessioni quando si torna a /profiles
    clearCurrentProfile();
    AuthBridge.clearBridgedSession();

    // Pulisci TUTTE le chiavi di sessione possibili
    localStorage.removeItem("superuser-session");
    localStorage.removeItem("superuser-session-expiry");
    localStorage.removeItem("fantasmia_current_user_id");
    localStorage.removeItem("fantasmia_supabase_session");
    localStorage.removeItem("current_profile_id");

    console.log("🧹 Profiles: sessioni pulite, avvio sincronizzazione profili...");

    const syncAndLoadProfiles = async () => {
      // ✅ REQUISITO 2: Loading bloccante - inizia
      setIsLoadingProfiles(true);

      try {
        // ✅ NUOVA LOGICA: Usa loadProfilesUnified come fonte unica
        const result = await loadProfilesUnified();

        // 🛡️ FILTRO OT: Escludiamo tutti i profili one-time dalla lista
        const filteredProfiles = result.profiles.filter(
          (p) => !p.id.startsWith("onetime_") && !(p as any).is_one_time_token,
        );

        console.log(
          "📋 Profiles.tsx: caricati " + filteredProfiles.length + " profili (esclusi OT) da " + result.source,
        );

        setProfiles(filteredProfiles);

        // Add special profiles - REMOVED 'new-profile' as per NSU management requirements
        // NSU creation now happens ONLY via Superuser panel
        const specialProfiles = [
          {
            id: "superuser",
            name: "Superuser",
            type: "SUPERUSER",
            icon: Shield,
            requiresPassword: true,
          },
        ];

        setAllProfiles([...filteredProfiles, ...specialProfiles]);
      } catch (error) {
        console.error("❌ Errore caricamento profili:", error);
      }

      // ✅ REQUISITO 2: Loading bloccante - fine
      setIsLoadingProfiles(false);
    };

    syncAndLoadProfiles();
  }, []);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    setPassword("");
    // No more direct access for new-profile - removed
  };

  const handleLogin = async () => {
    // Permetti password di soli spazi (es. "  ") - controllo lunghezza invece di trim
    if (password.length < 2) {
      toast({
        title: "Errore",
        description: "Inserisci la password (almeno 2 caratteri)",
        variant: "destructive",
      });
      return;
    }

    if (selectedProfile === "superuser") {
      // Use the same secure password as SuperUser component
      if (password === "ssss") {
        // Generate secure session for superuser
        const sessionToken = crypto.getRandomValues(new Uint8Array(32));
        const sessionString = Array.from(sessionToken, (byte) => byte.toString(16).padStart(2, "0")).join("");
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        localStorage.setItem("superuser-session", sessionString);
        localStorage.setItem("superuser-session-expiry", expiryTime.toString());

        // Create a bridged session for superuser to access Supabase
        const superuserProfile = {
          id: "superuser",
          name: "Superuser",
          password: "ssss",
          age: 30,
        };
        AuthBridge.createLocalSupabaseSession(superuserProfile);

        // Salva il profilo Superuser in fantasmia_users e imposta come profilo corrente
        const users = JSON.parse(localStorage.getItem("fantasmia_users") || "[]");
        const existingSU = users.find((u: any) => u.id === "superuser");
        if (!existingSU) {
          users.push({
            ...superuserProfile,
            userType: "superuser",
          });
          localStorage.setItem("fantasmia_users", JSON.stringify(users));
        }
        setCurrentProfileId("superuser");

        // Garbage collection: cleanup expired and inactive profiles
        try {
          const cleanedExpired = await cleanupExpiredProfiles();
          const cleanedInactive = await cleanupInactiveProfiles("superuser");
          if (cleanedExpired > 0 || cleanedInactive > 0) {
            console.log(`🧹 GC: rimossi ${cleanedExpired} scaduti, ${cleanedInactive} inattivi`);
          }
        } catch (e) {
          console.warn("GC error:", e);
        }

        navigate("/superuser");
      } else {
        toast({
          title: "Errore",
          description: "Password non corretta",
          variant: "destructive",
        });
      }
      return;
    }

    // NSU Authentication with new system
    const selectedUser = profiles.find((p) => p.id === selectedProfile);
    if (selectedUser) {
      // Try new NSU authentication first
      const result = await authenticateNSU(selectedUser.id, password);

      if (result.success && result.profile) {
        // DEMO MODE: Disabilitato redirect a cambio password
        // if (result.needsPasswordChange) {
        //   navigate('/change-password', {
        //     state: {
        //       profileId: result.profile.id,
        //       profile: result.profile
        //     }
        //   });
        //   return;
        // }

        // Set as current profile for IndexedDB
        setCurrentProfileId(result.profile.id);

        // Bridge the user to Supabase authentication
        AuthBridge.createLocalSupabaseSession({
          id: result.profile.id,
          name: result.profile.name,
          password: password,
          age: 10,
        });

        navigate("/dashboard", {
          state: {
            profileId: selectedProfile,
            profileName: selectedUser.name,
          },
        });
      } else {
        // Fallback to legacy authentication for old profiles
        const user = authenticateUser(selectedUser.name, password);
        if (user) {
          setCurrentProfileId(user.id);
          AuthBridge.createLocalSupabaseSession(user);

          // Check for unread messages
          if (user.unreadMessages && user.unreadMessages.length > 0) {
            const messages = user.unreadMessages.filter((m) => !m.read);
            if (messages.length > 0) {
              navigate("/dashboard", {
                state: { userId: user.id, profileName: selectedUser.name, showMessages: true },
              });
              return;
            }
          }
          navigate("/dashboard", { state: { profileId: selectedProfile, profileName: selectedUser.name } });
        } else {
          toast({
            title: "Errore",
            description: result.error || "Password non corretta",
            variant: "destructive",
          });
        }
      }
    }
  };

  // ✅ REQUISITO 2: Schermata di caricamento bloccante con ripple/pulse migliorato
  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          {/* Ripple/pulse effect visibile su mobile */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            {/* Middle pulse ring */}
            <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse"></div>
            {/* Inner spinning circle */}
            <div className="absolute inset-4 rounded-full border-4 border-primary/40 border-t-primary animate-spin"></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-slate-700 animate-pulse">Caricamento profili...</p>
          <p className="text-sm text-slate-500 mt-2">Sincronizzazione in corso</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />

      {/* Fixed Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Back Button - Top Left */}
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>

          {/* Page Title - Center */}
          <h1 className="text-xl font-bold text-slate-800">Elenco Profili</h1>

          {/* Home Button - Top Right */}
          <Button variant="ghost" onClick={() => navigate("/profiles")} className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      <div className="max-w-2xl mx-auto pt-20">
        {!selectedProfile ? (
          /* Profile Selection */
          <Card>
            <CardHeader>
              <CardTitle>Seleziona Profilo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profilo</label>
                <Select onValueChange={handleProfileSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Scegli un profilo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {allProfiles.map((profile) => {
                      const IconComponent = profile.icon || User;
                      return (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            <span className={profile.type === "NEW" ? "font-bold" : ""}>{profile.name}</span>
                            {profile.type && profile.type !== "NEW" && (
                              <span className="text-xs text-slate-500">({profile.type})</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Password Input */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Inserisci Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-600 mb-4">
                  Profilo selezionato: <strong>{allProfiles.find((p) => p.id === selectedProfile)?.name}</strong>
                </p>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />
                {/* Hint password per profili NSU */}
                {selectedProfile && selectedProfile !== "superuser" && (
                  <div className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                    💡 Digita la password fornita dal Superuser (2 caratteri)
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setSelectedProfile(null)} variant="outline" className="flex-1">
                  Indietro
                </Button>
                <Button onClick={handleLogin} disabled={password.length < 2} className="flex-1">
                  Accedi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profiles;
