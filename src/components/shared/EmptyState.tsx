import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  /** Illustration style — "panel" (documents/generic) or "person" (members) */
  variant?: "panel" | "person";
}

const PanelIllustration = ({ Icon }: { Icon?: LucideIcon }) => (
  <div className="relative mb-5 flex items-center justify-center">
    <svg width="128" height="94" viewBox="0 0 128 94" className="text-primary/20" aria-hidden>
      <rect
        x="12"
        y="16"
        width="104"
        height="62"
        rx="10"
        fill="hsl(var(--primary) / 0.05)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
      <line x1="42" y1="66" x2="86" y2="66" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
    {Icon && (
      <span className="absolute top-[26px] flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 ring-4 ring-card">
        <Icon className="h-5 w-5 text-primary" />
      </span>
    )}
  </div>
);

const PersonIllustration = ({ Icon }: { Icon?: LucideIcon }) => (
  <div className="relative mb-5 flex items-center justify-center">
    <svg width="112" height="86" viewBox="0 0 112 86" className="text-primary/20" aria-hidden>
      <circle
        cx="56"
        cy="30"
        r="16"
        fill="hsl(var(--primary) / 0.06)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M28 74c0-15 12-24 28-24s28 9 28 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
    </svg>
    {Icon && (
      <span className="absolute top-[18px] flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-4 ring-card">
        <Icon className="h-4 w-4 text-primary" />
      </span>
    )}
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  variant = "panel",
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl bg-card shadow-card">
      {variant === "person" ? <PersonIllustration Icon={Icon} /> : <PanelIllustration Icon={Icon} />}
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 h-10 font-semibold">
          {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
