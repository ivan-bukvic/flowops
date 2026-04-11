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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  email: string;
  onRemoved: () => void;
}

const RemoveMemberDialog = ({ open, onOpenChange, orgId, userId, email, onRemoved }: RemoveMemberDialogProps) => {
  const handleRemove = async () => {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("org_id", orgId)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to remove member.");
    } else {
      toast.success("Member removed successfully.");
      await supabase.rpc("emit_event", {
        p_org_id: orgId,
        p_type: "MEMBER_REMOVED",
        p_metadata: { user_id: userId },
      });
      onRemoved();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{email}</strong> from this workspace? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveMemberDialog;
