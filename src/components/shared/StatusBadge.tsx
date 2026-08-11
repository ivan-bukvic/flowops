import { Check, Clock, Loader2, X, type LucideIcon } from "lucide-react";

interface StatusConfig {
  label: string;
  className: string;
  icon: LucideIcon;
  spin?: boolean;
}

const statusConfig: Record<string, StatusConfig> = {
  uploaded: { label: "Uploaded", className: "bg-success/10 text-success", icon: Check },
  completed: { label: "Completed", className: "bg-success/10 text-success", icon: Check },
  active: { label: "Active", className: "bg-success/10 text-success", icon: Check },
  success: { label: "Success", className: "bg-success/10 text-success", icon: Check },
  processing: { label: "Processing", className: "bg-info/10 text-info", icon: Loader2, spin: true },
  running: { label: "Running", className: "bg-info/10 text-info", icon: Loader2, spin: true },
  pending: { label: "Pending", className: "bg-warning/10 text-warning", icon: Clock },
  queued: { label: "Queued", className: "bg-warning/10 text-warning", icon: Clock },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive", icon: X },
  error: { label: "Error", className: "bg-destructive/10 text-destructive", icon: X },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground", icon: Clock },
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config =
    statusConfig[status] ?? {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      className: "bg-muted text-muted-foreground",
      icon: Clock,
    };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      <Icon className={`h-3 w-3 ${config.spin ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
