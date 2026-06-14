import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import HomePage from "./pages/mass-media/HomePage.tsx";
import CategoryPage from "./pages/mass-media/CategoryPage.tsx";
import ArticlePage from "./pages/mass-media/ArticlePage.tsx";
import OpinionPage from "./pages/mass-media/OpinionPage.tsx";
import SubscriptionPage from "./pages/mass-media/SubscriptionPage.tsx";

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
          <Route path="/mass-media/opinion" element={<OpinionPage />} />
          <Route path="/mass-media/subscribe" element={<SubscriptionPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
