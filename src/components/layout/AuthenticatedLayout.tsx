import RequireAuth from "@/components/RequireAuth";
import { OrgProvider } from "@/contexts/OrgContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import TopNav from "@/components/layout/TopNav";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <OrgProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopNav />
            <div className="flex-1 overflow-auto bg-background pt-2">{children}</div>
          </div>
        </div>
      </SidebarProvider>
    </OrgProvider>
  </RequireAuth>
);

export default AuthenticatedLayout;
