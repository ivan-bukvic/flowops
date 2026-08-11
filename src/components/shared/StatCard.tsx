import { ReactNode } from "react";
import { LucideIcon, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  suffix?: string;
  description?: string;
  /** Tailwind text-color class for the icon, e.g. "text-primary" */
  accentText?: string;
  /** Tailwind bg-color class for the icon chip, e.g. "bg-primary/10" */
  accentBg?: string;
  /** Solid Tailwind bg-color class used for the mini bar chart, e.g. "bg-primary" */
  accentBar?: string;
  /**
   * Real weekly time-series (5–7 values). When present, renders a mini bar
   * chart. When omitted, the chart is hidden and an optional textual trend
   * is shown instead — no data is fabricated.
   */
  series?: number[];
  /** Optional short textual trend, shown top-right (e.g. "+2 this week"). */
  trend?: string;
}

const MiniBarChart = ({ data, barClass }: { data: number[]; barClass: string }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="mt-3 flex h-6 items-end gap-1" aria-hidden>
      {data.map((v, i) => {
        const pct = Math.max(12, Math.round((v / max) * 100));
        // Earlier bars are lighter; the most recent bar is the strongest.
        const opacity = 0.35 + (i / Math.max(data.length - 1, 1)) * 0.65;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${barClass}`}
            style={{ height: `${pct}%`, opacity }}
          />
        );
      })}
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  suffix,
  description,
  accentText = "text-primary",
  accentBg = "bg-primary/10",
  accentBar = "bg-primary",
  series,
  trend,
}: StatCardProps) => (
  <div className="rounded-2xl bg-card p-4 shadow-card">
    <div className="flex items-center justify-between">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBg} ${accentText}`}>
        <Icon className="h-4 w-4" />
      </div>
      {trend && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </span>
      )}
    </div>

    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
    <div className="mt-0.5 flex items-baseline gap-1.5">
      <span className="font-display text-2xl font-bold tabular-nums text-foreground">{value}</span>
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
    {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}

    {series && series.length > 0 && <MiniBarChart data={series} barClass={accentBar} />}
  </div>
);

export default StatCard;
