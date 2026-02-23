import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrgProvider } from "@/contexts/OrgContext";
import RequireOrg from "@/components/RequireOrg";
import Index from "./pages/Index";
import CreateWorkspace from "./pages/CreateWorkspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OrgProvider>
          <Routes>
            <Route path="/create-workspace" element={<CreateWorkspace />} />
            <Route
              path="/"
              element={
                <RequireOrg>
                  <Index />
                </RequireOrg>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrgProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
