import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AILoadingProvider } from "@/hooks/useAILoading";
import { useContentUpdates } from "@/hooks/useContentUpdates";
import { useRuntimeVersionCheck } from "@/hooks/useRuntimeVersionCheck";
import { useAdminHotkey } from "@/hooks/useAdminHotkey";
import { useOneTimeSessionCheck } from "@/hooks/useOneTimeSessionCheck";
import ContentUpdateOverlay from "@/components/shared/ContentUpdateOverlay";
import RuntimeUpdateOverlay from "@/components/shared/RuntimeUpdateOverlay";
import BootstrapLoadingOverlay from "@/components/shared/BootstrapLoadingOverlay";
import OneTimeSessionBanner from "@/components/shared/OneTimeSessionBanner";
import { fantasMiaDB } from "@/utils/indexedDB";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSUUsers from "./pages/admin/AdminSUUsers";
import AdminOrgTypes from "./pages/admin/AdminOrgTypes";
import AdminFeaturesMatrix from "./pages/admin/AdminFeaturesMatrix";
import AdminContracts3F from "./pages/admin/AdminContracts3F";
import AdminSettingsPage from "./pages/admin/AdminSettings";
import AdminStoryTypeSelection from "./pages/admin/AdminStoryTypeSelection";
import AdminDailyStories from "./pages/admin/AdminDailyStories";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import AdminAGReadingStories from "./pages/admin/AdminAGReadingStories";
import AdminAGScienceStories from "./pages/admin/AdminAGScienceStories";
import AdminAGGreekMyths from "./pages/admin/AdminAGGreekMyths";
import AdminAGNordicMyths from "./pages/admin/AdminAGNordicMyths";
import AdminAGExplorers from "./pages/admin/AdminAGExplorers";
import NewHome from "./pages/NewHome";
import About from "./pages/About";
import Company from "./pages/Company";
import Spare from "./pages/Spare";
import Privacy from "./pages/Privacy";
import Contacts from "./pages/Contacts";
import NoteLegali from "./pages/NoteLegali";
import TermsAcceptance from "./pages/TermsAcceptance";
import Dashboard from "./pages/Dashboard";
import Profiles from "./pages/Profiles";
import NewProfile from "./pages/NewProfile";
import SuperUser from "./pages/SuperUser";
import PublicUser from "./pages/PublicUser";
import CreateStory from "./pages/CreateStory";
import PrivacyAcceptanceScreen from "./pages/PrivacyAcceptanceScreen";
import ProppEditor from "./pages/ProppEditor";
import ProppModeSelector from "./pages/ProppModeSelector";
import GhostEditor from "./pages/GhostEditor";
import StoryViewer from "./pages/StoryViewer";
import UserStoryViewer from "./pages/UserStoryViewer";
import SuperuserUserStoryViewer from "./pages/SuperuserUserStoryViewer";
import SuperuserAMArchive from "./pages/SuperuserAMArchive";
import AlbumCreator from "./pages/AlbumCreator";
import SuperuserArchive from "./pages/SuperuserArchive";
import SuperuserUsers from "./pages/SuperuserUsers";
import SuperuserSettings from "./pages/SuperuserSettings";
import SuperuserPasswordChange from "./pages/SuperuserPasswordChange";
import SuperuserPaymentSettings from "./pages/SuperuserPaymentSettings";
import ParoleChiamanoEditor from "./pages/ParoleChiamanoEditor";
import ProfessionStoryEditor from "./pages/ProfessionStoryEditor";
import AirotsEditor from "./pages/AirotsEditor";
import CampbellEditor from "./pages/CampbellEditor";
import CSSEditor from "./pages/CSSEditor";
import ReadingStories from "./pages/ReadingStories";
import ScienceStories from "./pages/ScienceStories";
import ScienceStoryEditor from "./pages/ScienceStoryEditor";
import MagicStoryEditor from "./pages/MagicStoryEditor";
import StrangeFactEditor from "./pages/StrangeFactEditor";
import SuperuserReadingStoriesManagement from "./pages/SuperuserReadingStoriesManagement";
import SuperuserScienceStoriesManagement from "./pages/SuperuserScienceStoriesManagement";
import SuperuserGreekMythsManagement from "./pages/SuperuserGreekMythsManagement";
import SuperuserNordicMythsManagement from "./pages/SuperuserNordicMythsManagement";
import SuperuserExplorersManagement from "./pages/SuperuserExplorersManagement";
import SuperuserStoryTypeSelection from "./pages/SuperuserStoryTypeSelection";
import SuperuserReadingStoriesView from "./pages/SuperuserReadingStoriesView";
import UserNordicMyths from "./pages/UserNordicMyths";
import UserExplorers from "./pages/UserExplorers";
import GroupStoryEditor from "./pages/GroupStoryEditor";
import CTStorySelector from "./pages/CTStorySelector";
import CTManagement from "./pages/CTManagement";
import SuperuserDailyStoriesManagement from "./pages/SuperuserDailyStoriesManagement";
// import ReadingStoryViewer from "./pages/ReadingStoryViewer"; // DEPRECATO: rimosso, usare AGStoryDetail
import UserArchive from "./pages/UserArchive";
import StoryTypeSelection from "./pages/StoryTypeSelection";
import ChangePassword from "./pages/ChangePassword";
// NSUManagementPage rimosso - funzionalità integrate in SuperuserUsers
// import ScienceStoryViewer from "./pages/ScienceStoryViewer"; // DEPRECATO: rimosso, usare AGStoryDetail
import AGReadingStories from "./pages/AGReadingStories";
import AGScienceStories from "./pages/AGScienceStories";
import AGGreekMyths from "./pages/AGGreekMyths";
import AGNordicMyths from "./pages/AGNordicMyths";
import AGExplorers from "./pages/AGExplorers";
import AGStoryDetail from "./pages/AGStoryDetail";
import UserGreekMyths from "./pages/UserGreekMyths";
import UserScienceStories from "./pages/UserScienceStories";
import UserReadingStories from "./pages/UserReadingStories";
import AGUserStoryDetail from "./components/shared/AGUserStoryDetail";
import OneTimeAccess from "./pages/OneTimeAccess";
import AdminOneTimeLinks from "./pages/admin/AdminOneTimeLinks";
import ProtectedRouteGuard from "./components/shared/ProtectedRouteGuard";
import { usePopstateGuard } from "./hooks/usePopstateGuard";

import DebugIndexedDB from "./pages/DebugIndexedDB";
import NotFound from "./pages/NotFound";
import { initImageMigration } from "./utils/imageMigration";

const queryClient = new QueryClient();

// Admin hotkey listener component (must be inside BrowserRouter)
const AdminHotkeyListener = () => {
  useAdminHotkey();
  return null;
};

// Global security guard for popstate (browser back/forward)
const GlobalSecurityGuard = () => {
  usePopstateGuard();
  return null;
};

// Initialize image migration on app startup
initImageMigration();

// One-time session check wrapper (must be inside BrowserRouter)
const OneTimeSessionChecker = () => {
  useOneTimeSessionCheck();
  return null;
};

// Inner component that uses hooks
const AppContent = () => {
  const { showUpdateOverlay, updates, dismissOverlay } = useContentUpdates();
  const { isCheckingVersion, needsUpdate, isUpdating, timeoutReached, startUpdate } = useRuntimeVersionCheck();
  const [appReady, setAppReady] = useState(false);

  // Bootstrap: ensure DB and seed stories are ready before rendering app
  useEffect(() => {
    const bootstrap = async () => {
      // Don't bootstrap if we need an update (will reload anyway)
      if (needsUpdate || isCheckingVersion) return;
      
      try {
        console.log('App: Bootstrap starting...');
        await fantasMiaDB.init();
        // Load both AG seed stories and daily stories in parallel
        await Promise.all([
          fantasMiaDB.ensureAGSeedStoriesLoaded(),
          fantasMiaDB.ensureDailyStoriesLoaded()
        ]);
        console.log('App: Bootstrap complete, app ready');
        setAppReady(true);
      } catch (error) {
        console.error('App: Bootstrap error:', error);
        // Still mark as ready to avoid blocking forever
        setAppReady(true);
      }
    };
    
    bootstrap();
  }, [needsUpdate, isCheckingVersion]);

  // Show blocking update overlay if new version detected
  if (needsUpdate) {
    return (
      <RuntimeUpdateOverlay
        isUpdating={isUpdating}
        timeoutReached={timeoutReached}
        onStartUpdate={startUpdate}
      />
    );
  }

  // Show loading overlay while checking version or bootstrapping
  if (isCheckingVersion || !appReady) {
    return <BootstrapLoadingOverlay message="Caricamento..." />;
  }
  
  return (
    <>
      {/* Content Update Overlay (only for NSU) */}
      <ContentUpdateOverlay 
        isOpen={showUpdateOverlay}
        updates={updates}
        onDismiss={dismissOverlay}
      />
      
      <BrowserRouter>
        <GlobalSecurityGuard />
        <AdminHotkeyListener />
        <OneTimeSessionChecker />
        <OneTimeSessionBanner />
        <ProtectedRouteGuard>
        <Routes>
          <Route path="/" element={<NewHome />} />
          <Route path="/one-time" element={<OneTimeAccess />} />
          <Route path="/about" element={<About />} />
          <Route path="/company" element={<Company />} />
          <Route path="/spare" element={<Spare />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/note-legali" element={<NoteLegali />} />
          <Route path="/terms-acceptance" element={<TermsAcceptance />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/new-profile" element={<NewProfile />} />
          <Route path="/superuser" element={<SuperUser />} />
          <Route path="/public" element={<PublicUser />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/privacy-acceptance" element={<PrivacyAcceptanceScreen />} />
          <Route path="/propp-mode-selector" element={<ProppModeSelector />} />
          <Route path="/propp-editor" element={<ProppEditor />} />
          <Route path="/ghost-editor" element={<GhostEditor />} />
          <Route path="/story/:storyId" element={<StoryViewer />} />
          <Route path="/story-viewer/:storyId" element={<StoryViewer />} />
          <Route path="/superuser-archive" element={<SuperuserArchive />} />
          <Route path="/superuser-users" element={<SuperuserUsers />} />
          <Route path="/superuser-settings" element={<SuperuserSettings />} />
          <Route path="/superuser-password-change" element={<SuperuserPasswordChange />} />
          <Route path="/superuser-payment-settings" element={<SuperuserPaymentSettings />} />
          <Route path="/parole-chiamano" element={<ParoleChiamanoEditor />} />
          <Route path="/profession-story" element={<ProfessionStoryEditor />} />
          <Route path="/airots-editor" element={<AirotsEditor />} />
          <Route path="/campbell-editor" element={<CampbellEditor />} />
          <Route path="/css-editor" element={<CSSEditor />} />
          <Route path="/strange-fact-editor" element={<StrangeFactEditor />} />
          <Route path="/ct-selector" element={<CTStorySelector />} />
          <Route path="/group-story" element={<GroupStoryEditor />} />
          <Route path="/ct-management" element={<CTManagement />} />
          <Route path="/change-password" element={<ChangePassword />} />
          {/* Route /superuser-nsu-management rimossa - funzionalità in /superuser-users */}
          <Route path="/superuser-daily-stories" element={<SuperuserDailyStoriesManagement />} />
          <Route path="/story-type-selection" element={<StoryTypeSelection />} />
          <Route path="/reading-stories" element={<ReadingStories />} />
          <Route path="/science-stories" element={<ScienceStories />} />
          
          <Route path="/user-archive" element={<UserArchive />} />
          <Route path="/user-story-viewer/:id" element={<UserStoryViewer />} />
          <Route path="/superuser-user-story-viewer/:id" element={<SuperuserUserStoryViewer />} />
          <Route path="/superuser-am-archive" element={<SuperuserAMArchive />} />
          <Route path="/album-creator" element={<AlbumCreator />} />
          <Route path="/superuser-story-type-selection" element={<SuperuserStoryTypeSelection />} />
          <Route path="/superuser-reading-stories-view" element={<SuperuserReadingStoriesView />} />
          <Route path="/superuser-reading-stories-management" element={<SuperuserReadingStoriesManagement />} />
          <Route path="/magic-story-editor" element={<MagicStoryEditor />} />
          <Route path="/science-story-editor" element={<ScienceStoryEditor />} />
          
          <Route path="/superuser-science-stories-management" element={<SuperuserScienceStoriesManagement />} />
          <Route path="/superuser-greek-myths-management" element={<SuperuserGreekMythsManagement />} />
          <Route path="/superuser-nordic-myths-management" element={<SuperuserNordicMythsManagement />} />
          <Route path="/superuser-explorers-management" element={<SuperuserExplorersManagement />} />
          <Route path="/user-nordic-myths" element={<UserNordicMyths />} />
          <Route path="/user-explorers" element={<UserExplorers />} />
          <Route path="/user-greek-myths" element={<UserGreekMyths />} />
          <Route path="/user-science-stories" element={<UserScienceStories />} />
          <Route path="/user-reading-stories" element={<UserReadingStories />} />
          
          {/* New AG (Public Stories) Routes for NSU */}
          <Route path="/ag-story-detail/:id" element={<AGUserStoryDetail />} />
          
          {/* AG Routes for Superuser */}
          <Route path="/ag-reading-stories" element={<AGReadingStories />} />
          <Route path="/ag-science-stories" element={<AGScienceStories />} />
          <Route path="/ag-greek-myths" element={<AGGreekMyths />} />
          <Route path="/ag-nordic-myths" element={<AGNordicMyths />} />
          <Route path="/ag-explorers" element={<AGExplorers />} />
          <Route path="/ag-story-detail-su/:id" element={<AGStoryDetail />} />
          <Route path="/debug-indexdb" element={<DebugIndexedDB />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          } />
          <Route path="/admin/su-users" element={
            <AdminGuard>
              <AdminSUUsers />
            </AdminGuard>
          } />
          <Route path="/admin/org-types" element={
            <AdminGuard>
              <AdminOrgTypes />
            </AdminGuard>
          } />
          <Route path="/admin/features-matrix" element={
            <AdminGuard>
              <AdminFeaturesMatrix />
            </AdminGuard>
          } />
          <Route path="/admin/contracts-3f" element={
            <AdminGuard>
              <AdminContracts3F />
            </AdminGuard>
          } />
          <Route path="/admin/settings" element={
            <AdminGuard>
              <AdminSettingsPage />
            </AdminGuard>
          } />
          <Route path="/admin/stories" element={
            <AdminGuard>
              <AdminStoryTypeSelection />
            </AdminGuard>
          } />
          <Route path="/admin/daily-stories" element={
            <AdminGuard>
              <AdminDailyStories />
            </AdminGuard>
          } />
          <Route path="/admin/system-settings" element={
            <AdminGuard>
              <AdminSystemSettings />
            </AdminGuard>
          } />
          <Route path="/admin/ag-reading-stories" element={
            <AdminGuard>
              <AdminAGReadingStories />
            </AdminGuard>
          } />
          <Route path="/admin/ag-science-stories" element={
            <AdminGuard>
              <AdminAGScienceStories />
            </AdminGuard>
          } />
          <Route path="/admin/ag-greek-myths" element={
            <AdminGuard>
              <AdminAGGreekMyths />
            </AdminGuard>
          } />
          <Route path="/admin/ag-nordic-myths" element={
            <AdminGuard>
              <AdminAGNordicMyths />
            </AdminGuard>
          } />
          <Route path="/admin/ag-explorers" element={
            <AdminGuard>
              <AdminAGExplorers />
            </AdminGuard>
          } />
          <Route path="/admin/one-time-links" element={
            <AdminGuard>
              <AdminOneTimeLinks />
            </AdminGuard>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ProtectedRouteGuard>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AILoadingProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AILoadingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
