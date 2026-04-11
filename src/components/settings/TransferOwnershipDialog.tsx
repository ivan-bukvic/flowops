import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Member {
  user_id: string;
  email: string;
  role: string;
}

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  members: Member[];
  currentUserId: string;
  onTransferred: () => void;
}

const TransferOwnershipDialog = ({ open, onOpenChange, orgId, members, currentUserId, onTransferred }: TransferOwnershipDialogProps) => {
  const [targetUserId, setTargetUserId] = useState("");

  const eligibleMembers = members.filter((m) => m.user_id !== currentUserId);

  const handleTransfer = async () => {
    if (!targetUserId) {
      toast.error("Please select a member.");
      return;
    }

    const { error } = await supabase.rpc("transfer_organization_ownership", {
      p_org_id: orgId,
      p_new_owner_id: targetUserId,
    });

    if (error) {
      toast.error("Failed to transfer ownership.");
    } else {
      toast.success("Ownership transferred successfully.");
      onTransferred();
    }
    onOpenChange(false);
    setTargetUserId("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
          <AlertDialogDescription>
            Transfer workspace ownership to another member. You will be downgraded to admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <Label>New Owner</Label>
          <Select value={targetUserId} onValueChange={setTargetUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a member" />
            </SelectTrigger>
            <SelectContent>
              {eligibleMembers.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTransfer}>Transfer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TransferOwnershipDialog;
