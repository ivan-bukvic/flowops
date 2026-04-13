
Problem

The Documents table is still relying on width utility classes on individual header/body cells (`w-[35%]`, etc.) instead of defining the column structure at the table level. That means the browser can still let cell content influence sizing, especially with the current name/summary wrappers, so header and row columns can look slightly off even with `table-fixed`.

Plan

1. Add true column-width support to the existing shared Documents table
- Update `src/components/shared/DataTable.tsx` so columns can define an explicit width.
- Render a `<colgroup>` directly inside `<Table>` before `<TableHeader>`.
- Keep the table itself as `w-full table-fixed`.
- Keep the table inside the existing responsive `overflow-x-auto` container.

2. Move Documents widths into `<colgroup>`
- Update `src/pages/Documents.tsx` so the five columns define widths as:
  - 35% Document Name
  - 20% Project
  - 15% Status
  - 15% Summary
  - 15% Created
- Remove width classes from the Documents column `className` values so sizing comes only from `<colgroup>`.

3. Standardize alignment and remove layout conflicts
- Ensure DataTable header and body cells use the same base classes: `px-4 py-3 text-left align-middle whitespace-nowrap`.
- Keep `<TableCell>` free of flex/grid/justify layout classes.
- Simplify Documents cell renderers so inner content respects the column width:
  - document name: width-aware clickable row content with clean truncation
  - summary: truncate within the column instead of using fixed max widths
  - status: preserve the inline-flex badge styling without extra layout wrappers that affect width

4. Keep the change tightly scoped
- Do not create new components.
- Do not change unrelated pages or icons.
- Make the new DataTable width support optional so Projects, Automations, and Project Detail continue working unchanged.

Technical details

- Most likely implementation: add an optional `width?: string` field to `Column<T>`, then render:
  `colgroup > col style={{ width: "35%" }}`
- The current `max-w-[250px]` style on the document name is a likely contributor to the visual drift; I would replace that with `w-full min-w-0 truncate` so the column width comes from the table, not the inner content.
- No database or backend work is needed for this fix.

Files to modify

- `src/components/shared/DataTable.tsx`
- `src/pages/Documents.tsx`

Verification

- Header labels align exactly with row values on `/documents`
- Long document names/summaries truncate without shifting the grid
- Status badges remain vertically centered
- Horizontal scrolling works on smaller screens without header/body drift
