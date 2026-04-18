
The current `handleDelete` in `src/pages/Projects.tsx` already does soft-delete + emit_event + refetch, and `fetchProjects` already filters `deleted_at IS NULL`. The issue is likely the RLS policy: `projects` only has UPDATE policy for project_members with role 'editor'/'owner' — but org owners/admins who created the project may not be in `project_members`, so the update silently affects 0 rows (no error, no removal).

I'll verify by checking RLS, then fix by:
1. Add `.select()` to the update so we can detect 0-row updates and surface an error.
2. Add console logging for success/error.
3. Add an UPDATE RLS policy allowing org owners/admins to soft-delete projects in their org (matches the existing INSERT policy pattern and the `canCreate` UI gate).
4. Optimistically remove the project from local state after successful update, then refetch.

## Plan

**1. Migration: add RLS UPDATE policy for org owners/admins on `projects`**
```sql
CREATE POLICY "Org owners and admins can update projects"
ON public.projects FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.org_id = projects.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.org_id = projects.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin')
));
```

**2. `src/pages/Projects.tsx` — update `handleDelete`**
- Use `.update({ deleted_at: ... }).eq('id', project.id).eq('org_id', selectedOrgId).select()` so we get back the affected rows.
- If `error`: `console.error('[Projects] delete failed', error)`, show alert, return.
- If `data.length === 0`: `console.warn('[Projects] no rows updated — likely RLS')`, alert "No permission".
- On success: `console.log('[Projects] soft-deleted', project.id)`, optimistically `setProjects(prev => prev.filter(p => p.id !== project.id))`, then call `fetchProjects()` to reconcile.
- Keep existing `emit_event` + `triggerAutomations` flow.

**3. Confirm `fetchProjects` already filters `.is('deleted_at', null)`** — it does, no change needed.

**4. No changes to `handleUpdate` (edit) or other logic.**

### Flow
```text
click trash → AlertDialog → confirm
  → supabase.update({deleted_at}) .select()
    ├─ error → console.error + alert
    ├─ 0 rows → console.warn + alert "No permission"
    └─ success → console.log + remove from state + emit_event + refetch
```
