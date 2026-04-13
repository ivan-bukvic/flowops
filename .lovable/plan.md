

## Problem

Three places display document names by parsing `file_url` instead of using the stored `original_name`:

1. **DocumentDetail.tsx** (line 71) -- does `file_url.split("/").pop()`, showing the UUID-prefixed storage name
2. **ProjectDetail.tsx** (line 287) -- same `file_url.split("/").pop()` in the documents tab render
3. **ProjectDetail.tsx** (line 201-207) -- upload insert doesn't save `original_name`, and the optimistic local row doesn't include it either

The global Documents page (`Documents.tsx`) already handles this correctly via `original_name || extractFileName(file_url)`.

## Plan

### 1. Fix DocumentDetail.tsx
- Add `original_name` to the select query (line 38)
- Add `original_name` to the `DocumentDetail` interface
- Replace line 71's `file_url.split("/").pop()` with `doc.original_name || extractFileName(doc.file_url)` using the same UUID-stripping helper from Documents.tsx

### 2. Fix ProjectDetail.tsx — display
- Add `original_name` to the `DocumentRow` interface
- Add `original_name` to the select query (line 182)
- Replace line 287's `file_url.split("/").pop()` with `row.original_name || extractFileName(row.file_url)`

### 3. Fix ProjectDetail.tsx — upload
- Add `original_name: file.name` to the insert call (line 201-207)
- Add `original_name: file.name` to the optimistic local row (line 214-222)

### 4. Extract shared helper
- Move `extractFileName` to `src/lib/utils.ts` so all three files can import it without duplication

### Files to modify
- `src/lib/utils.ts` — add `extractFileName` helper
- `src/pages/DocumentDetail.tsx` — fetch and display `original_name`
- `src/pages/ProjectDetail.tsx` — fetch, display, and store `original_name`
- `src/pages/Documents.tsx` — import shared helper instead of local function

No database changes needed — `original_name` column already exists.

