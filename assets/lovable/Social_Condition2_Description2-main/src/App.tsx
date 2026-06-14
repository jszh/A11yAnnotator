import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import FoliaFeed from "./pages/social-media/FoliaFeed.tsx";
import FoliaExplore from "./pages/social-media/FoliaExplore.tsx";
import FoliaNotifications from "./pages/social-media/FoliaNotifications.tsx";
import FoliaMessages from "./pages/social-media/FoliaMessages.tsx";
import FoliaProfile from "./pages/social-media/FoliaProfile.tsx";
import FoliaSettings from "./pages/social-media/FoliaSettings.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/social-media" replace />} />
          <Route path="/social-media" element={<FoliaFeed />} />
          <Route path="/social-media/explore" element={<FoliaExplore />} />
          <Route path="/social-media/notifications" element={<FoliaNotifications />} />
          <Route path="/social-media/messages" element={<FoliaMessages />} />
          <Route path="/social-media/profile" element={<FoliaProfile />} />
          <Route path="/social-media/settings" element={<FoliaSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
