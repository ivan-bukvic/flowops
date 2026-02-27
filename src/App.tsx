import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import RequireAuth from "@/components/RequireAuth";
import RequireOrg from "@/components/RequireOrg";
import TopBar from "@/components/TopBar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateWorkspace from "./pages/CreateWorkspace";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <OrgProvider>
      <TopBar />
      {children}
    </OrgProvider>
  </RequireAuth>
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
            <Route
              path="/dashboard"
              element={
                <AuthenticatedLayout>
                  <RequireOrg><Dashboard /></RequireOrg>
                </AuthenticatedLayout>
              }
            />
            <Route
              path="/events"
              element={
                <AuthenticatedLayout>
                  <RequireOrg><Events /></RequireOrg>
                </AuthenticatedLayout>
              }
            />
            <Route
              path="/projects"
              element={
                <AuthenticatedLayout>
                  <RequireOrg><Projects /></RequireOrg>
                </AuthenticatedLayout>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <AuthenticatedLayout>
                  <RequireOrg><ProjectDetail /></RequireOrg>
                </AuthenticatedLayout>
              }
            />
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
