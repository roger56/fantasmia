
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ReadingStoryTypeSelection from "./pages/ReadingStoryTypeSelection";
import ScienceStories from "./pages/ScienceStories";
import SuperuserReadingStoriesManagement from "./pages/SuperuserReadingStoriesManagement";
import SuperuserStoryTypeSelection from "./pages/SuperuserStoryTypeSelection";
import SuperuserReadingStoriesView from "./pages/SuperuserReadingStoriesView";
import SuperuserReadingStoryViewer from "./pages/SuperuserReadingStoryViewer";
import ReadingStoryViewer from "./pages/ReadingStoryViewer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
          <Route path="/reading-story-type-selection" element={<ReadingStoryTypeSelection />} />
          <Route path="/reading-stories" element={<ReadingStories />} />
          <Route path="/reading-stories/science" element={<ScienceStories />} />
          <Route path="/reading-stories/magic" element={<ReadingStories />} />
          <Route path="/reading-story-viewer/:storyId" element={<ReadingStoryViewer />} />
          <Route path="/superuser-story-type-selection" element={<SuperuserStoryTypeSelection />} />
          <Route path="/superuser-reading-stories-management" element={<SuperuserReadingStoriesManagement />} />
          <Route path="/superuser-reading-stories-view" element={<SuperuserReadingStoriesView />} />
          <Route path="/superuser-reading-story-viewer/:id" element={<SuperuserReadingStoryViewer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App; 
