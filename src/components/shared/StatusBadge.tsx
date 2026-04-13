const statusStyles: Record<string, string> = {
  uploaded: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-secondary text-secondary-foreground",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-secondary text-secondary-foreground"}`}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

export default StatusBadge;
