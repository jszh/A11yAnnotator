import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import EduLayout from "./edu-portal/components/EduLayout";
import EduHome from "./edu-portal/pages/EduHome";
import EduCourses from "./edu-portal/pages/EduCourses";
import EduCourseDetail from "./edu-portal/pages/EduCourseDetail";
import EduStudy from "./edu-portal/pages/EduStudy";
import EduPricing from "./edu-portal/pages/EduPricing";
import EduDashboard from "./edu-portal/pages/EduDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/old" element={<Index />} />
          <Route path="/" element={<EduLayout />}>
            <Route index element={<EduHome />} />
            <Route path="courses" element={<EduCourses />} />
            <Route path="courses/:id" element={<EduCourseDetail />} />
            <Route path="study" element={<EduStudy />} />
            <Route path="pricing" element={<EduPricing />} />
            <Route path="dashboard" element={<EduDashboard />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
