import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage = "No data found.",
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="border border-border/80 rounded-lg overflow-hidden overflow-x-auto bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <Table className="w-full table-fixed">
        {columns.some((col) => col.width) && (
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
        )}
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/80">
            {columns.map((col) => (
              <TableHead key={col.key} className={`h-auto px-6 py-4 text-left align-middle text-sm font-medium text-muted-foreground ${col.className ?? ""}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow
              key={row.id ?? i}
              className={`border-b border-border/60 last:border-0 transition-colors duration-100 ${onRowClick ? "cursor-pointer hover:bg-accent/40" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={`px-6 py-4 text-left align-middle ${col.className ?? ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
