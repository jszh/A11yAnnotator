import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GovLayout from "@/components/government/GovLayout";
import GovHome from "@/pages/government/GovHome";
import GovServices from "@/pages/government/GovServices";
import GovPermits from "@/pages/government/GovPermits";
import GovPayBill from "@/pages/government/GovPayBill";
import GovAbout from "@/pages/government/GovAbout";
import GovContact from "@/pages/government/GovContact";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/government" replace />} />
          <Route path="/government" element={<GovLayout />}>
            <Route index element={<GovHome />} />
            <Route path="services" element={<GovServices />} />
            <Route path="services/permits" element={<GovPermits />} />
            <Route path="services/pay-bill" element={<GovPayBill />} />
            <Route path="about" element={<GovAbout />} />
            <Route path="contact" element={<GovContact />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
