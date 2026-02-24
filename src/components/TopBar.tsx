import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TopBar = () => {
  const navigate = useNavigate();
  const { selectedOrgId, setSelectedOrgId, organizations } = useOrg();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const linkBase = "text-sm text-muted-foreground hover:text-foreground transition-colors py-1";
  const linkActive = "text-foreground font-medium border-b-2 border-foreground";

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-foreground">FlowOps AI</span>
        <nav className="flex items-center gap-4">
          <NavLink to="/dashboard" className={linkBase} activeClassName={linkActive}>Dashboard</NavLink>
          <NavLink to="/events" className={linkBase} activeClassName={linkActive}>Audit Log</NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {organizations.length > 0 && (
          <Select value={selectedOrgId ?? ""} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
