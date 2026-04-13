
Problem
- The remaining misalignment is coming from shared `DataTable` styling, not the `<colgroup>`. Right now the header and body still use different box-model rules: the header has custom uppercase/smaller text plus `h-10 px-4`, while cells use a separate `px-4 py-3` pattern. The Documents renderers also still have width-constraining wrappers (`max-w-xs`) that can fight the column widths visually.

Plan

1. Normalize the shared table spacing/alignment
- Update `src/components/shared/DataTable.tsx` so header and body use the same padding/alignment foundation.
- Set `<TableHead>` to: `h-auto px-6 py-4 text-left align-middle text-sm font-medium text-muted-foreground`
- Set `<TableCell>` to: `px-6 py-4 text-left align-middle`
- Remove the current uppercase/tracking/smaller header styling and the old `px-4 py-3` values.
- Keep the existing `<colgroup>` and `className="w-full table-fixed"` on the table.

2. Simplify Documents cell content so the table owns the widths
- Update `src/pages/Documents.tsx` only.
- Document Name: remove `max-w-xs` and any width caps; keep the click behavior, but let only the filename text truncate with `block truncate`.
- Summary: remove `max-w-xs`; use `block truncate text-muted-foreground`.
- Keep project/date cells as simple text spans.
- Keep status badges as `inline-flex items-center` with no extra wrapper that could affect alignment.

3. Keep the fix tightly scoped
- Do not change the table structure, column percentages, or unrelated pages.
- Do not add flex/grid/justify utilities to `TableHead` or `TableCell`.
- Leave `src/components/ui/table.tsx` alone unless the primitive’s default header height still needs to be neutralized via `h-auto` from `DataTable`.

Technical details
- Files to update:
  - `src/components/shared/DataTable.tsx`
  - `src/pages/Documents.tsx`
- Widths remain:
  - 35% Document Name
  - 20% Project
  - 15% Status
  - 15% Summary
  - 15% Created
- `StatusBadge` already uses `inline-flex items-center`, so it likely does not need changes.

Verification
- Check `/documents` at desktop and smaller widths to confirm each header sits directly over its values.
- Verify long document names and summaries truncate inside their own columns without shifting the grid.
- Spot-check other shared `DataTable` usages (Projects, Automations, Project Detail) to ensure the shared padding change still looks consistent.
