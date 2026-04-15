

## Plan: Display Full Names Instead of Emails

### Problem
The app shows emails (or UUID fragments) for user identity across all pages. The `profiles` table has a `full_name` column that should be used with fallback to email.

### Approach

**1. Add a shared utility function** in `src/lib/utils.ts`:
```ts
export function getDisplayName(profile: { full_name?: string | null; email?: string | null } | null): string {
  return profile?.full_name || profile?.email || "Unknown User";
}
```

**2. Update files that resolve user identity** — fetch `full_name` alongside `email` from `profiles`, then use `getDisplayName()`:

| File | Current behavior | Change |
|------|-----------------|--------|
| `src/pages/ProjectDetail.tsx` | Fetches `profiles.email` for creator | Add `full_name` to select, use `getDisplayName` |
| `src/components/projects/ProjectSettings.tsx` | Receives `creatorDisplay` (email) | No change needed — upstream fix handles it |
| `src/pages/Events.tsx` | Resolves actor emails only | Fetch `full_name`, use `getDisplayName` in actor label |
| `src/components/dashboard/RecentActivity.tsx` | Resolves actor emails, splits at `@` | Fetch `full_name`, use `getDisplayName` for actor name |
| `src/components/projects/MembersList.tsx` | Shows `profiles.email` | Update parent to pass `full_name`; display with `getDisplayName` |
| `src/pages/ProjectDetail.tsx` (members fetch) | Fetches `profiles.id, email` for members | Add `full_name` to select, pass to MembersList |
| `src/components/projects/ProjectAiQueries.tsx` | Shows no user info | Fetch `user_id` and resolve to name (optional enhancement) |
| `src/pages/Settings.tsx` | Uses `org_members_simple` view (email only) | Need DB migration to add `full_name` to the view |

**3. Database migration** — Update `org_members_simple` view to include `full_name`:
```sql
CREATE OR REPLACE VIEW org_members_simple AS
SELECT om.org_id, om.user_id, om.role, p.email, p.full_name
FROM organization_members om
LEFT JOIN profiles p ON p.id = om.user_id;
```

Also update `get_org_members_with_email` RPC to return `full_name`:
```sql
CREATE OR REPLACE FUNCTION public.get_org_members_with_email(p_org_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text)
...
  return query
  select om.user_id, p.email, p.full_name
  from organization_members om
  left join profiles p on p.id = om.user_id
  where om.org_id = p_org_id;
```

### Files to modify
- `src/lib/utils.ts` — add `getDisplayName`
- `src/pages/ProjectDetail.tsx` — creator + members full_name
- `src/components/projects/MembersList.tsx` — display full_name with email subtitle
- `src/pages/Events.tsx` — actor full_name
- `src/components/dashboard/RecentActivity.tsx` — actor full_name
- `src/pages/Settings.tsx` — member full_name display
- `src/components/projects/ProjectAiQueries.tsx` — show querying user name
- **Migration**: update `org_members_simple` view and `get_org_members_with_email` RPC

### Not modified
- `src/pages/Documents.tsx` — no user display
- `src/pages/DocumentDetail.tsx` — no user display
- `src/components/automations/AutomationActivity.tsx` — no user display currently

