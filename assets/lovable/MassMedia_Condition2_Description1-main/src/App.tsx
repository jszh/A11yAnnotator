import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import HomePage from "./mass-media/pages/HomePage";
import WorldPage from "./mass-media/pages/WorldPage";
import ArticlePage from "./mass-media/pages/ArticlePage";
import OpinionPage from "./mass-media/pages/OpinionPage";
import SubscribePage from "./mass-media/pages/SubscribePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mass-media" element={<HomePage />} />
          <Route path="/mass-media/world" element={<WorldPage />} />
          <Route path="/mass-media/article/:slug" element={<ArticlePage />} />
          <Route path="/mass-media/opinion" element={<OpinionPage />} />
          <Route path="/mass-media/subscribe" element={<SubscribePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
