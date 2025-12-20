
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AILoadingProvider } from "@/hooks/useAILoading";
import NewHome from "./pages/NewHome";
import About from "./pages/About";
import Company from "./pages/Company";
import Spare from "./pages/Spare";
import Privacy from "./pages/Privacy";
import Contacts from "./pages/Contacts";
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

import DebugIndexedDB from "./pages/DebugIndexedDB";
import NotFound from "./pages/NotFound";
import { initImageMigration } from "./utils/imageMigration";

const queryClient = new QueryClient();

// Initialize image migration on app startup
initImageMigration();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AILoadingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<NewHome />} />
            <Route path="/about" element={<About />} />
            <Route path="/company" element={<Company />} />
            <Route path="/spare" element={<Spare />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contacts" element={<Contacts />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AILoadingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
