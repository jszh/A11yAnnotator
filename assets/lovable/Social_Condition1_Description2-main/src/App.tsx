import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import FeedPage from "./pages/social-media/FeedPage.tsx";
import ExplorePage from "./pages/social-media/ExplorePage.tsx";
import NotificationsPage from "./pages/social-media/NotificationsPage.tsx";
import MessagesPage from "./pages/social-media/MessagesPage.tsx";
import ProfilePage from "./pages/social-media/ProfilePage.tsx";
import SettingsPage from "./pages/social-media/SettingsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/social-media" replace />} />
          <Route path="/social-media" element={<FeedPage />} />
          <Route path="/social-media/explore" element={<ExplorePage />} />
          <Route path="/social-media/notifications" element={<NotificationsPage />} />
          <Route path="/social-media/messages" element={<MessagesPage />} />
          <Route path="/social-media/profile" element={<ProfilePage />} />
          <Route path="/social-media/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
