import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

const Index = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedOrgId, isLoading: orgLoading } = useOrg();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || orgLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
    } else if (selectedOrgId) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/create-workspace", { replace: true });
    }
  }, [user, authLoading, orgLoading, selectedOrgId, navigate]);

  return null;
};

export default Index;
