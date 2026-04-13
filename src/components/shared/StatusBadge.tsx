import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  retry: "bg-yellow-100 text-yellow-800",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-secondary text-secondary-foreground",
  pending: "bg-amber-100 text-amber-700",
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <Badge
    variant="outline"
    className={`inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-secondary text-secondary-foreground"}`}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

export default StatusBadge;
