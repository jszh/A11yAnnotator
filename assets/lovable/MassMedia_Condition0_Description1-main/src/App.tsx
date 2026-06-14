import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MediaHome from "./pages/mass-media/MediaHome";
import WorldCategory from "./pages/mass-media/WorldCategory";
import ArticleDetail from "./pages/mass-media/ArticleDetail";
import OpinionPage from "./pages/mass-media/OpinionPage";
import SubscribePage from "./pages/mass-media/SubscribePage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/mass-media" replace />} />
          <Route path="/mass-media" element={<MediaHome />} />
          <Route path="/mass-media/world" element={<WorldCategory />} />
          <Route path="/mass-media/article" element={<ArticleDetail />} />
          <Route path="/mass-media/opinion" element={<OpinionPage />} />
          <Route path="/mass-media/subscribe" element={<SubscribePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
