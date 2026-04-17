import { Navigate, useLocation } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";

const RequireOrg = ({ children }: { children: React.ReactNode }) => {
  const { selectedOrgId, isLoading, organizations } = useOrg();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!selectedOrgId) {
    console.log("[RequireOrg] redirecting to /create-workspace", {
      pathname: location.pathname,
      orgsCount: organizations.length,
    });
    return (
      <div className="p-6">
        <pre className="text-xs bg-yellow-100 text-black p-3 rounded overflow-auto border border-yellow-400">
{JSON.stringify(
  {
    where: "RequireOrg",
    pathname: location.pathname,
    selectedOrgId,
    orgsCount: organizations.length,
    note: "About to redirect to /create-workspace",
  },
  null,
  2,
)}
        </pre>
        <Navigate to="/create-workspace" replace />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireOrg;
