import { Users } from "lucide-react";
import { getDisplayName } from "@/lib/utils";

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface MembersListProps {
  members: MemberRow[];
  loading: boolean;
}

const roleBadgeStyles: Record<string, string> = {
  editor: "bg-[hsl(224,76%,48%,0.08)] text-[hsl(224,76%,48%)]",
  viewer: "bg-[hsl(220,13%,91%)] text-[hsl(215,16%,47%)]",
  owner: "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]",
};

const MembersList = ({ members, loading }: MembersListProps) => {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No members yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add organization members to this project to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const displayName = getDisplayName(member.profiles);
        const email = member.profiles?.email;
        const initial = (member.profiles?.full_name ?? email ?? "?")[0];

        return (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {initial}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                {member.profiles?.full_name && email && (
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md ${
                roleBadgeStyles[member.role] ?? roleBadgeStyles.viewer
              }`}
            >
              {member.role}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
