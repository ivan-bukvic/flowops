import { useState } from "react";
import { Trash2, Users } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  canRemove?: boolean;
  canEditRole?: boolean;
  onRemove?: (member: MemberRow) => Promise<void> | void;
  onToggleRole?: (member: MemberRow, newRole: "editor" | "viewer") => Promise<void> | void;
}

const roleBadgeStyles: Record<string, string> = {
  editor: "bg-[hsl(224,76%,48%,0.08)] text-[hsl(224,76%,48%)]",
  viewer: "bg-[hsl(220,13%,91%)] text-[hsl(215,16%,47%)]",
  owner: "bg-[hsl(160,84%,39%,0.08)] text-[hsl(160,84%,39%)]",
};

const MembersList = ({ members, loading, canRemove, onRemove }: MembersListProps) => {
  const [pendingRemove, setPendingRemove] = useState<MemberRow | null>(null);
  const [removing, setRemoving] = useState(false);

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

  const ownerCount = members.filter((m) => m.role === "owner").length;

  const handleConfirm = async () => {
    if (!pendingRemove || !onRemove) return;
    setRemoving(true);
    try {
      await onRemove(pendingRemove);
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {members.map((member) => {
          const displayName = getDisplayName(member.profiles);
          const email = member.profiles?.email;
          const initial = (member.profiles?.full_name ?? email ?? "?")[0];
          const isLastOwner = member.role === "owner" && ownerCount <= 1;
          const showRemove = canRemove && !isLastOwner;

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
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md ${
                    roleBadgeStyles[member.role] ?? roleBadgeStyles.viewer
                  }`}
                >
                  {member.role}
                </span>
                {showRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setPendingRemove(member)}
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(open) => !open && !removing && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this member from the project?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove
                ? `${getDisplayName(pendingRemove.profiles)} will lose access to this project.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MembersList;
