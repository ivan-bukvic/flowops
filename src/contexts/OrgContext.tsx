import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

interface OrgContextValue {
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  organizations: { id: string; name: string }[];
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
};

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: memberships, error } = await supabase
        .from("organization_members")
        .select("org_id, organizations(id, name)")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Failed to fetch organizations:", error);
        setIsLoading(false);
        return;
      }

      const orgs = (memberships ?? [])
        .map((m) => {
          const org = m.organizations as unknown as { id: string; name: string; deleted_at: string | null } | null;
          return org && !org.deleted_at ? { id: org.id, name: org.name } : null;
        })
        .filter(Boolean) as { id: string; name: string }[];

      setOrganizations(orgs);

      if (orgs.length > 0) {
        setSelectedOrgId(orgs[0].id);
      } else if (location.pathname !== "/create-workspace") {
        navigate("/create-workspace", { replace: true });
      }

      setIsLoading(false);
    };

    fetchOrgs();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOrgs();
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <OrgContext.Provider value={{ selectedOrgId, setSelectedOrgId, organizations, isLoading }}>
      {children}
    </OrgContext.Provider>
  );
};
