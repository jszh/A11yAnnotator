import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import HomePage from "./pages/mass-media/HomePage";
import CategoryPage from "./pages/mass-media/CategoryPage";
import ArticlePage from "./pages/mass-media/ArticlePage";
import PerspectivesPage from "./pages/mass-media/PerspectivesPage";
import SubscribePage from "./pages/mass-media/SubscribePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/mass-media" replace />} />
          <Route path="/mass-media" element={<HomePage />} />
          <Route path="/mass-media/category/:slug" element={<CategoryPage />} />
          <Route path="/mass-media/article" element={<ArticlePage />} />
          <Route path="/mass-media/perspectives" element={<PerspectivesPage />} />
          <Route path="/mass-media/subscribe" element={<SubscribePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
