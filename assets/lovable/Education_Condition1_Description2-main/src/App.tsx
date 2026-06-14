import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import HomePage from "./edu-portal/pages/HomePage";
import CoursesPage from "./edu-portal/pages/CoursesPage";
import CourseDetailPage from "./edu-portal/pages/CourseDetailPage";
import StudyToolPage from "./edu-portal/pages/StudyToolPage";
import PricingPage from "./edu-portal/pages/PricingPage";
import DashboardPage from "./edu-portal/pages/DashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/edu-portal" element={<HomePage />} />
          <Route path="/edu-portal/courses" element={<CoursesPage />} />
          <Route path="/edu-portal/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/edu-portal/study" element={<StudyToolPage />} />
          <Route path="/edu-portal/pricing" element={<PricingPage />} />
          <Route path="/edu-portal/dashboard" element={<DashboardPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
