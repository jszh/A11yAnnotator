import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import EduHomePage from "./pages/edu-portal/EduHomePage.tsx";
import EduCoursesPage from "./pages/edu-portal/EduCoursesPage.tsx";
import EduCourseDetailPage from "./pages/edu-portal/EduCourseDetailPage.tsx";
import EduStudyPage from "./pages/edu-portal/EduStudyPage.tsx";
import EduPricingPage from "./pages/edu-portal/EduPricingPage.tsx";
import EduDashboardPage from "./pages/edu-portal/EduDashboardPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/edu-portal" element={<EduHomePage />} />
          <Route path="/edu-portal/courses" element={<EduCoursesPage />} />
          <Route path="/edu-portal/courses/:courseId" element={<EduCourseDetailPage />} />
          <Route path="/edu-portal/study" element={<EduStudyPage />} />
          <Route path="/edu-portal/pricing" element={<EduPricingPage />} />
          <Route path="/edu-portal/dashboard" element={<EduDashboardPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
