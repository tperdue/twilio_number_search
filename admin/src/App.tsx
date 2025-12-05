import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SelectedRegulationsProvider } from "@/contexts/SelectedRegulationsContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import SyncManagement from "./pages/SyncManagement";
import Countries from "./pages/Countries";
import CountryDetail from "./pages/CountryDetail";
import NumberSearch from "./pages/NumberSearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SelectedRegulationsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sync" element={<SyncManagement />} />
              <Route path="/countries" element={<Countries />} />
              <Route path="/countries/:countryCode" element={<CountryDetail />} />
              <Route path="/numbers" element={<NumberSearch />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SelectedRegulationsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

