
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import NewProfile from "./pages/NewProfile";
import SuperUser from "./pages/SuperUser";
import PublicUser from "./pages/PublicUser";
import Archive from "./pages/Archive";
import CreateStory from "./pages/CreateStory";
import ProppEditor from "./pages/ProppEditor";
import ProppModeSelector from "./pages/ProppModeSelector";
import GhostEditor from "./pages/GhostEditor";
import StoryViewer from "./pages/StoryViewer";
import SuperuserArchive from "./pages/SuperuserArchive";
import SuperuserUsers from "./pages/SuperuserUsers";
import ParoleChiamanoEditor from "./pages/ParoleChiamanoEditor";
import AlovafEditor from "./pages/AlovafEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/new-profile" element={<NewProfile />} />
          <Route path="/superuser" element={<SuperUser />} />
          <Route path="/public" element={<PublicUser />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/propp-mode-selector" element={<ProppModeSelector />} />
          <Route path="/propp-editor" element={<ProppEditor />} />
          <Route path="/ghost-editor" element={<GhostEditor />} />
          <Route path="/story/:storyId" element={<StoryViewer />} />
          <Route path="/superuser-archive" element={<SuperuserArchive />} />
          <Route path="/superuser-users" element={<SuperuserUsers />} />
          <Route path="/parole-chiamano" element={<ParoleChiamanoEditor />} />
          <Route path="/alovaf-editor" element={<AlovafEditor />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
