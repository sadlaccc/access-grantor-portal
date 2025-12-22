import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Helpdesk from "./pages/Helpdesk";
import Projects from "./pages/Projects";
import Assets from "./pages/Assets";
import Directory from "./pages/Directory";
import Reports from "./pages/Reports";
import Knowledge from "./pages/Knowledge";
import Admin from "./pages/Admin";
import HRM from "./pages/HRM";
import CRM from "./pages/CRM";
import Collaboration from "./pages/Collaboration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/helpdesk" element={<Helpdesk />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/hrm" element={<HRM />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/collaboration" element={<Collaboration />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
