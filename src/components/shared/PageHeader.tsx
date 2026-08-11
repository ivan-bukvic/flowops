import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

const PageHeader = ({ title, description, actionLabel, actionIcon: Icon, onAction }: PageHeaderProps) => (
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="shadow-sm shrink-0">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {actionLabel}
      </Button>
    )}
  </div>
);

export default PageHeader;
