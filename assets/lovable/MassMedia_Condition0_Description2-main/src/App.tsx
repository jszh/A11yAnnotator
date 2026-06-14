import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import GroundworkLayout from "./mass-media/components/GroundworkLayout";
import HomePage from "./mass-media/pages/HomePage";
import CategoryPage from "./mass-media/pages/CategoryPage";
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
          <Route path="/" element={<GroundworkLayout />}>
            <Route index element={<HomePage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="article" element={<ArticlePage />} />
            <Route path="opinion" element={<OpinionPage />} />
            <Route path="subscribe" element={<SubscribePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
