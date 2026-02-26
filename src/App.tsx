import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LanguagePreference from "./pages/LanguagePreference";
import Dashboard from "./pages/Dashboard";
import WasteGuide from "./pages/WasteGuide";
import CompostGuide from "./pages/CompostGuide";
import LiveTracking from "./pages/LiveTracking";
import Complaints from "./pages/Complaints";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import Marketplace from "./pages/Marketplace";
import WasteClassifier from "./pages/WasteClassifier";
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
          <Route path="/login" element={<Login />} />
          <Route path="/language" element={<LanguagePreference />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/waste-guide" element={<WasteGuide />} />
          <Route path="/compost-guide" element={<CompostGuide />} />
          <Route path="/live-tracking" element={<LiveTracking />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/waste-classifier" element={<WasteClassifier />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
