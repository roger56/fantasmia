import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, UserPlus, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveUser } from "@/utils/userStorage";
import { saveProfileToAllSources } from "@/utils/profileSync";
import { AuthBridge } from "@/utils/authBridge";
import { validateUserName, validateUserEmail } from "@/utils/validation";
import { setCurrentProfileId, getCurrentProfileId } from "@/utils/profileManager";
import HomeButton from "@/components/HomeButton";

const NewProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
  });

  // Supervisor confirmation state
  const [showSupervisorDialog, setShowSupervisorDialog] = useState(false);
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate name with security checks
    const nameError = validateUserName(formData.name);
    if (nameError) {
      toast({
        title: "Nome non valido",
        description: nameError,
        variant: "destructive",
      });
      return;
    }

    // Validate email if provided
    const emailError = validateUserEmail(formData.email);
    if (emailError) {
      toast({
        title: "Email non valida",
        description: emailError,
        variant: "destructive",
      });
      return;
    }

    // Validate age
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 1 || age > 120) {
      toast({
        title: "Età non valida",
        description: "Inserisci un'età valida tra 1 e 120 anni",
        variant: "destructive",
      });
      return;
    }

    // Prepare user data
    const newUser = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      age: parseInt(formData.age),
      password: formData.name.trim(), // Password same as name
      lastAccess: new Date().toISOString(),
      unreadMessages: [],
    };

    // Store pending user and show supervisor confirmation dialog
    setPendingUser(newUser);
    setSupervisorPassword("");
    setShowSupervisorDialog(true);
  };

  const handleSupervisorConfirm = async () => {
    if (!pendingUser) return;

    setIsVerifying(true);

    try {
      // La password del supervisore è la stessa usata in Profiles.tsx per il login SU
      // Al momento è hardcoded a 'ssss' - in futuro potrebbe essere configurabile
      const SUPERVISOR_PASSWORD = "ssss";

      // Verifica diretta della password (stessa logica di Profiles.tsx)
      const isValid = supervisorPassword === SUPERVISOR_PASSWORD;

      if (!isValid) {
        toast({
          title: "Password errata",
          description: "La password del supervisore non è corretta",
          variant: "destructive",
        });
        setSupervisorPassword("");
        setIsVerifying(false);
        return;
      }

      // Password verificata! Procedi con la creazione del profilo
      setShowSupervisorDialog(false);
      setSupervisorPassword(""); // Clear password (not stored)

      await createProfile(pendingUser);
    } catch (error) {
      console.error("Supervisor verification error:", error);
      toast({
        title: "Errore verifica",
        description: "Si è verificato un errore durante la verifica",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const createProfile = async (newUser: any) => {
    // ✅ NUOVA LOGICA: Usa saveProfileToAllSources per salvare in TUTTE le fonti
    try {
      await saveProfileToAllSources({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        age: newUser.age,
        user_type: "user",
        created_at: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
      });

      // Emit event for real-time updates
      window.dispatchEvent(
        new CustomEvent("profiles:changed", {
          detail: { id: newUser.id, username: newUser.name, role: "user" },
        }),
      );

      console.info("profiles-write", { id: newUser.id, username: newUser.name, role: "user" });
    } catch (error) {
      console.error("Error saving profile:", error);
    }

    // Set current profile id
    setCurrentProfileId(newUser.id);

    // Create AuthBridge session
    const sessionCreated = await AuthBridge.createLocalSupabaseSession(newUser);
    console.log("🔧 NewProfile: Sessione AuthBridge creata:", sessionCreated, "userId:", newUser.id);

    // Verify profile ID was saved correctly
    const savedProfileId = getCurrentProfileId();
    if (savedProfileId !== newUser.id) {
      console.warn("⚠️ NewProfile: ProfileId mismatch, ri-imposto:", newUser.id);
      setCurrentProfileId(newUser.id);
    }

    toast({
      title: "Profilo creato!",
      description: `Il profilo ${newUser.name} è stato creato con successo`,
    });

    // Navigate to privacy acceptance screen
    navigate("/privacy-acceptance", { state: { profileId: newUser.id, profileName: newUser.name } });
  };

  const handleDialogClose = () => {
    setShowSupervisorDialog(false);
    setSupervisorPassword("");
    setPendingUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Nuovo Profilo</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Crea Profilo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome Profilo</label>
              <Input
                type="text"
                placeholder="Inserisci il nome"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Età *</label>
              <Input
                type="number"
                placeholder="Inserisci l'età"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="text-lg"
                min="1"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email (facoltativo)</label>
              <Input
                type="email"
                placeholder="Inserisci l'email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">La password è definita dal Superuser</p>
            </div>

            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Richiede conferma del supervisore
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                Annulla
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Crea Profilo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supervisor Confirmation Dialog */}
      <Dialog open={showSupervisorDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm bg-white text-slate-900 border-slate-200" style={{ colorScheme: "light" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center text-slate-900">
              <ShieldCheck className="w-5 h-5 mr-2 text-amber-600" />
              Conferma Supervisore
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Per creare un nuovo profilo è necessaria la conferma del supervisore. Inserisci la password del
              supervisore per procedere.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Password Supervisore</label>
            <Input
              type="password"
              placeholder="Inserisci la password"
              value={supervisorPassword}
              onChange={(e) => setSupervisorPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && supervisorPassword) {
                  handleSupervisorConfirm();
                }
              }}
              className="bg-white text-slate-900 border-slate-300"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isVerifying}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSupervisorConfirm}
              disabled={!supervisorPassword || isVerifying}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifica...
                </>
              ) : (
                "Conferma"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewProfile;
