import { LucideIcon } from "lucide-react";
import ColoredIcon from "./ColoredIcon";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

const StatCard = ({ title, value, icon, description, iconBgClass = "bg-muted/60", iconColorClass = "text-muted-foreground/50" }: StatCardProps) => (
  <div className="rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1.5">{description}</p>}
      </div>
      <ColoredIcon icon={icon} bgClass={iconBgClass} iconClass={iconColorClass} />
    </div>
  </div>
);

export default StatCard;
