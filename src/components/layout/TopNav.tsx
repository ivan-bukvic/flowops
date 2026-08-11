import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, LogOut, Plus, Settings as SettingsIcon, User as UserIcon } from "lucide-react";

const TopNav = () => {
  const navigate = useNavigate();
  const { selectedOrgId, setSelectedOrgId, organizations } = useOrg();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const meta = (user?.user_metadata ?? {}) as { full_name?: string; avatar_url?: string };
  const displayName =
    meta.full_name?.trim() || user?.email?.split("@")[0] || "User";
  const avatarUrl = meta.avatar_url;
  const selectedOrgName =
    organizations.find((org) => org.id === selectedOrgId)?.name ?? "";
  const initials = (() => {
    const source = (meta.full_name?.trim() || user?.email || "U").trim();
    const parts = source.split(/[\s@._-]+/).filter(Boolean);
    const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
    return (letters || source[0] || "U").toUpperCase().slice(0, 2);
  })();

  return (
    <header className="bg-card border-b border-border/70">
      <div className="flex h-14 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 sm:flex-none">
          <SidebarTrigger className="shrink-0 lg:hidden" />

          {organizations.length > 0 && (
            <Select value={selectedOrgId ?? ""} onValueChange={setSelectedOrgId}>
              <SelectTrigger
                aria-label={selectedOrgName || "Workspace"}
                className="h-9 w-[150px] max-w-full shrink overflow-hidden px-2.5 text-sm font-medium sm:w-[190px]"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-left">
                    {selectedOrgName || "Workspace"}
                  </span>
                </span>
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

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hidden sm:inline-flex"
            onClick={() => navigate("/create-workspace")}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground md:hidden" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="flex items-center justify-center rounded-full transition-transform hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Avatar className="h-9 w-9 border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-[12px] font-semibold tracking-wide">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-lg shadow-md border-border/80">
              <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {user.email}
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="text-sm cursor-pointer rounded-md px-2.5 py-2"
              >
                <SettingsIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-sm cursor-pointer rounded-md px-2.5 py-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
