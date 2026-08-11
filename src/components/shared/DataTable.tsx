import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  /** Minimum column width (e.g. 160 or "10rem") — prevents squeeze on narrow viewports */
  minWidth?: number | string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionLabel?: string;
  emptyActionIcon?: LucideIcon;
  onEmptyAction?: () => void;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  /** Minimum table width before horizontal scroll kicks in */
  minWidth?: number | string;
}

function toCssSize(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyActionLabel,
  emptyActionIcon,
  onEmptyAction,
  skeletonRows = 5,
  onRowClick,
  minWidth = 720,
}: DataTableProps<T>) {
  const tableMinWidth = toCssSize(minWidth);

  const renderHeader = () => (
    <TableHeader>
      <TableRow className="bg-transparent hover:bg-transparent border-b border-border/70">
        {columns.map((col) => (
          <TableHead
            key={col.key}
            style={{ minWidth: toCssSize(col.minWidth) }}
            className={cn(
              "h-auto px-6 py-3.5 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap",
              col.className,
            )}
          >
            {col.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  const renderTable = (body: React.ReactNode) => (
    <div className="relative rounded-lg border border-border/80 bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <Table className="w-full" style={{ minWidth: tableMinWidth }}>
        {columns.some((col) => col.width || col.minWidth) && (
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: toCssSize(col.minWidth),
                }}
              />
            ))}
          </colgroup>
        )}
        {renderHeader()}
        {body}
      </Table>
      {/* Mobile scroll affordance — right-edge fade hints more columns */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-lg bg-gradient-to-l from-card to-transparent sm:hidden"
      />
    </div>
  );

  if (loading) {
    return renderTable(
      <TableBody>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <TableRow key={i} className="border-b border-border/60 last:border-0">
            {columns.map((col, j) => (
              <TableCell
                key={col.key}
                style={{ minWidth: toCssSize(col.minWidth) }}
                className="px-6 py-4 align-middle"
              >
                <Skeleton className={`h-4 ${j === 0 ? "w-2/3" : "w-1/2"}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>,
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle ?? emptyMessage ?? "No data found"}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionIcon={emptyActionIcon}
        onAction={onEmptyAction}
      />
    );
  }

  return renderTable(
    <TableBody>
      {data.map((row, i) => (
        <TableRow
          key={row.id ?? i}
          className={cn(
            "border-b border-border/60 last:border-0 transition-colors duration-100",
            onRowClick && "cursor-pointer hover:bg-accent/40",
          )}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((col) => (
            <TableCell
              key={col.key}
              style={{ minWidth: toCssSize(col.minWidth) }}
              className={cn("px-6 py-4 text-left align-middle", col.className)}
            >
              {col.render ? col.render(row) : row[col.key]}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>,
  );
}

export default DataTable;
