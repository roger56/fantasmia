import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, BookText, Users, Loader2 } from "lucide-react";
import { AuthBridge } from "@/utils/authBridge";
import StoryLayout from "@/components/shared/StoryLayout";
import DailyStoryOverlay from "@/components/shared/DailyStoryOverlay";
import ConosciLaParola from "@/components/shared/ConosciLaParola";
import { useDailyStory } from "@/hooks/useDailyStory";
import { getCurrentProfileId } from "@/utils/profileManager";
import { useOneTimeSessionCheck } from "@/hooks/useOneTimeSessionCheck";
import { useOTModeGuard } from "@/hooks/useOTModeGuard";

const Dashboard = () => {
  const profileId = getCurrentProfileId();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // One-time session check
  const { isOneTimeSession } = useOneTimeSessionCheck();

  // OT Mode guard per navigazione sicura
  const { safeNavigateBack } = useOTModeGuard();

  // Daily Story hook for NSU overlay
  const {
    showOverlay,
    dailyStory,
    handleClose,
    isLoading: dailyStoryLoading,
    isInitializing,
    hasTimedOut,
  } = useDailyStory();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate("/");
        return;
      }

      const isSU = authStatus.userName === "superuser" || authStatus.userName === "Superuser";

      // ✅ SU deve sempre usare /superuser, non /dashboard
      if (isSU) {
        navigate("/superuser", { replace: true });
        return;
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Solo loading della pagina, non aspettare dailyStoryLoading
  // L'overlay gestisce il suo stato di caricamento internamente
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Key forces re-mount when profile changes → useDailyStory re-executes
  return (
    <React.Fragment key={profileId || "no-profile"}>
      {/* Conosci la Parola - animated icon + overlay (only for NSU) */}
      <ConosciLaParola />

      {/* Indicatore caricamento racconti per utenti one-time */}
      {isInitializing && isOneTimeSession && !showOverlay && (
        <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 z-40 border border-purple-200">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-sm text-slate-700">Caricamento racconti del giorno...</span>
        </div>
      )}

      {/* Daily Story Overlay for NSU - mostra sempre se loading o overlay attivo */}
      {(dailyStoryLoading || isInitializing || hasTimedOut || (showOverlay && dailyStory)) && (
        <DailyStoryOverlay
          isOpen={showOverlay || dailyStoryLoading || isInitializing || hasTimedOut}
          story={dailyStory || { date: "", story: "", quote: "" }}
          onClose={handleClose}
          isInitializing={isInitializing || dailyStoryLoading}
          hasTimedOut={hasTimedOut}
        />
      )}

      <StoryLayout
        title="Fantas-Mia V2"
        subtitle="Dashboard utente"
        onBack={safeNavigateBack}
        showHomeButton={true}
        backgroundColor="bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50"
      >
        <div className="space-y-8">
          {/* Sezione Creazione Storie */}
          <section className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Creazione Storie
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standard Story Creation */}
              <Card
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
                onClick={() => navigate("/create-story")}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Crea la tua storia</h3>
                  <p className="text-slate-600 text-sm">
                    Inizia a creare una nuova storia interattiva (8 modalità disponibili)
                  </p>
                </CardContent>
              </Card>

              {/* Group Story Creation - Navigate to CT Selector */}
              <Card
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50"
                onClick={() => navigate("/ct-selector")}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className="text-yellow-500">
                        ⭐
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-violet-800 mb-1">Continua Tu...</h3>
                  <p className="text-violet-600 text-sm">
                    Scrivi una storia insieme agli altri utenti - Modalità collaborativa
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Sezione Archivi AM/AG */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AM - Archivio Magico */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
              <h2 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                AM - Archivio Magico
              </h2>
              <p className="text-purple-600 text-sm mb-4">Le tue storie personali</p>
              <Card
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-300"
                onClick={() => navigate("/user-archive")}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-800 mb-1">ARCHIVIO PERSONALE</h3>
                  <p className="text-purple-600 text-xs">Visualizza le tue storie create</p>
                </CardContent>
              </Card>
            </div>

            {/* AG - Archivio Generale */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <BookText className="w-5 h-5" />
                AG - Archivio Generale
              </h2>
              <p className="text-blue-600 text-sm mb-4">Storie condivise dal mondo</p>
              <Card
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300"
                onClick={() => navigate("/story-type-selection")}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookText className="w-6 h-6 text-blue-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-1">LETTURA STORIE DEL MONDO</h3>
                  <p className="text-blue-600 text-xs">Scopri storie e contenuti condivisi</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </StoryLayout>
    </React.Fragment>
  );
};

export default Dashboard;
