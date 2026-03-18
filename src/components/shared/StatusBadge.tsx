import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  uploaded: "bg-muted text-muted-foreground",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
  retry: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-secondary text-secondary-foreground",
  pending: "bg-secondary text-secondary-foreground",
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <Badge variant="outline" className={`text-xs font-medium border-0 px-2.5 py-0.5 rounded-md ${statusStyles[status] ?? "bg-secondary text-secondary-foreground"}`}>
    {status}
  </Badge>
);

export default StatusBadge;
