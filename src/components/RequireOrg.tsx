import { Navigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";

const RequireOrg = ({ children }: { children: React.ReactNode }) => {
  const { selectedOrgId, isLoading } = useOrg();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!selectedOrgId) {
    return <Navigate to="/create-workspace" replace />;
  }

  return <>{children}</>;
};

export default RequireOrg;
