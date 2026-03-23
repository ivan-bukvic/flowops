import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
  <div className="rounded-lg border border-border bg-card p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1.5">{description}</p>}
      </div>
      <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  </div>
);

export default StatCard;
