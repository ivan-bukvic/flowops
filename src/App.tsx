import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import RequireOrg from "@/components/RequireOrg";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateWorkspace from "./pages/CreateWorkspace";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import AI from "./pages/AI";
import Automations from "./pages/Automations";
import Events from "./pages/Events";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const OrgPage = ({ children }: { children: React.ReactNode }) => (
  <AuthenticatedLayout>
    <RequireOrg>{children}</RequireOrg>
  </AuthenticatedLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/create-workspace"
              element={
                <AuthenticatedLayout>
                  <CreateWorkspace />
                </AuthenticatedLayout>
              }
            />
            <Route path="/dashboard" element={<OrgPage><Dashboard /></OrgPage>} />
            <Route path="/projects" element={<OrgPage><Projects /></OrgPage>} />
            <Route path="/projects/:projectId" element={<OrgPage><ProjectDetail /></OrgPage>} />
            <Route path="/documents" element={<OrgPage><Documents /></OrgPage>} />
            <Route path="/ai" element={<OrgPage><AI /></OrgPage>} />
            <Route path="/automations" element={<OrgPage><Automations /></OrgPage>} />
            <Route path="/events" element={<OrgPage><Events /></OrgPage>} />
            <Route path="/integrations" element={<OrgPage><Integrations /></OrgPage>} />
            <Route path="/settings" element={<OrgPage><Settings /></OrgPage>} />
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
