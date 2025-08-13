
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import IntroductoryScreens from "./components/IntroductoryScreens";
import Home from "./pages/Home";
import NewHome from "./pages/NewHome";
import About from "./pages/About";
import Company from "./pages/Company";
import Spare from "./pages/Spare";
import Privacy from "./pages/Privacy";
import Contacts from "./pages/Contacts";
import TermsAcceptance from "./pages/TermsAcceptance";
import Dashboard from "./pages/Dashboard";
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
import AirotsEditor from "./pages/AirotsEditor";
import CampbellEditor from "./pages/CampbellEditor";
import CSSEditor from "./pages/CSSEditor";
import ReadingStories from "./pages/ReadingStories";
import SuperuserReadingStoriesManagement from "./pages/SuperuserReadingStoriesManagement";
import SuperuserReadingStoriesView from "./pages/SuperuserReadingStoriesView";
import SuperuserReadingStoryViewer from "./pages/SuperuserReadingStoryViewer";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<NewHome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/introductory-screens" element={<IntroductoryScreens />} />
          <Route path="/about" element={<About />} />
          <Route path="/company" element={<Company />} />
          <Route path="/spare" element={<Spare />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/terms-acceptance" element={<TermsAcceptance />} />
          <Route path="/public" element={<PublicUser />} />
          <Route path="/privacy-acceptance" element={<PrivacyAcceptanceScreen />} />
          
          {/* Protected routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-story" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
          <Route path="/propp-mode-selector" element={<ProtectedRoute><ProppModeSelector /></ProtectedRoute>} />
          <Route path="/propp-editor" element={<ProtectedRoute><ProppEditor /></ProtectedRoute>} />
          <Route path="/ghost-editor" element={<ProtectedRoute><GhostEditor /></ProtectedRoute>} />
          <Route path="/story/:storyId" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
          <Route path="/parole-chiamano" element={<ProtectedRoute><ParoleChiamanoEditor /></ProtectedRoute>} />
          <Route path="/airots-editor" element={<ProtectedRoute><AirotsEditor /></ProtectedRoute>} />
          <Route path="/campbell-editor" element={<ProtectedRoute><CampbellEditor /></ProtectedRoute>} />
          <Route path="/css-editor" element={<ProtectedRoute><CSSEditor /></ProtectedRoute>} />
          <Route path="/reading-stories" element={<ProtectedRoute><ReadingStories /></ProtectedRoute>} />
          
          {/* Admin only routes */}
          <Route path="/superuser" element={<ProtectedRoute requireAdmin><SuperUser /></ProtectedRoute>} />
          <Route path="/superuser-archive" element={<ProtectedRoute requireAdmin><SuperuserArchive /></ProtectedRoute>} />
          <Route path="/superuser-users" element={<ProtectedRoute requireAdmin><SuperuserUsers /></ProtectedRoute>} />
          <Route path="/superuser-settings" element={<ProtectedRoute requireAdmin><SuperuserSettings /></ProtectedRoute>} />
          <Route path="/superuser-password-change" element={<ProtectedRoute requireAdmin><SuperuserPasswordChange /></ProtectedRoute>} />
          <Route path="/superuser-payment-settings" element={<ProtectedRoute requireAdmin><SuperuserPaymentSettings /></ProtectedRoute>} />
          <Route path="/superuser-reading-stories-management" element={<ProtectedRoute requireAdmin><SuperuserReadingStoriesManagement /></ProtectedRoute>} />
          <Route path="/superuser-reading-stories-view" element={<ProtectedRoute requireAdmin><SuperuserReadingStoriesView /></ProtectedRoute>} />
          <Route path="/superuser-reading-story-viewer/:id" element={<ProtectedRoute requireAdmin><SuperuserReadingStoryViewer /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App; 
