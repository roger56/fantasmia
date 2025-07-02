
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import NewProfile from "./pages/NewProfile";
import SuperUser from "./pages/SuperUser";
import PublicUser from "./pages/PublicUser";
import Archive from "./pages/Archive";
import CreateStory from "./pages/CreateStory";
import ProppEditor from "./pages/ProppEditor";
import GhostEditor from "./pages/GhostEditor";
import StoryViewer from "./pages/StoryViewer";
import SuperuserArchive from "./pages/SuperuserArchive";
import SuperuserUsers from "./pages/SuperuserUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/new-profile" element={<NewProfile />} />
          <Route path="/superuser" element={<SuperUser />} />
          <Route path="/public" element={<PublicUser />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/propp-editor" element={<ProppEditor />} />
          <Route path="/ghost-editor" element={<GhostEditor />} />
          <Route path="/story/:storyId" element={<StoryViewer />} />
          <Route path="/superuser-archive" element={<SuperuserArchive />} />
          <Route path="/superuser-users" element={<SuperuserUsers />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
