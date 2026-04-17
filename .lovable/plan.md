
## Plan: Make Project Detail creator name source unambiguous

### What I’ll change
1. In `src/pages/ProjectDetail.tsx`, replace the current project fetch with a single source-of-truth query that always loads the creator profile together with the project:
```ts
const { data, error } = await supabase
  .from("projects")
  .select(`
    *,
    profiles:created_by (
      full_name
    )
  `)
  .eq("id", projectId)
  .single();
```
- No alternate project fetches
- No `.select("*")` fallback branch
- No dependence on navigation state, cached list data, or previous page context

2. Tighten the page state/rendering so the creator label only comes from the joined profile:
- While loading: `"Loading..."`
- After load: `project.profiles?.full_name ?? "Unknown User"`
- Never render `project.created_by` anywhere in the page UI

3. Keep the existing layout exactly as-is:
- Overview tab “Created By” text stays in the same place/styles
- Settings tab continues to show the same field, but from the resolved creator label only

4. Remove ambiguity in related code paths:
- Update the `ProjectRow` type to include the joined `profiles` object from the query
- Review `creatorDisplay` and any child props so there is no UUID fallback left in `ProjectDetail` or `ProjectSettings`

### Extra hardening
- Because direct links can open a project before workspace context is fully aligned, I’ll keep the project fetch driven by `projectId` itself so direct URL, refresh, and in-app navigation all use the same fresh query path.
- If needed, I’ll also sync workspace context from the fetched project’s `org_id` so other tabs on the page remain consistent for Slack/deep links.

## Technical details
- I inspected the current code: `ProjectDetail.tsx` already has a joined fetch pattern, but the fix should make that query the only fetch path and make the UI read only from `project.profiles?.full_name`.
- No database migration is needed for this step; the foreign key and embedded join support are already present.
- `created_by` may still exist in the returned row because `*` includes it, but the UI will not read or display it.

## Expected result
- Slack/direct URL load shows full name
- Refresh shows full name
- Internal navigation still works
- UUID is never shown in the “Created By” field
