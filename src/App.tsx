import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import DirectorDashboard from "./pages/dashboards/DirectorDashboard";
import HRDashboard from "./pages/dashboards/HRDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ITHeadDashboard from "./pages/dashboards/ITHeadDashboard";
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
          <Route path="/login/:role" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/dashboard/director" element={<DirectorDashboard />} />
          <Route path="/dashboard/hr" element={<HRDashboard />} />
          <Route path="/dashboard/accounts" element={<AccountsDashboard />} />
          <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/ithead" element={<ITHeadDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
