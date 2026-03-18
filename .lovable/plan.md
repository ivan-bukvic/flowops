

# Fix: Show member emails in the project members dropdown

## Problem
The org members query in `ProjectDetail.tsx` tries to select `email` directly from the `organization_members` table, which doesn't have that column. This causes a 400 error, resulting in an empty dropdown.

## Solution
Use the existing `get_org_members_with_email` RPC function instead of querying the table directly. This function is a `SECURITY DEFINER` that joins `organization_members` with `profiles` to return `user_id`, `email`, and `role` -- exactly what we need.

## Changes

**File: `src/pages/ProjectDetail.tsx`**

Replace the org members fetch `useEffect` (currently around lines 117-127) that does:
```ts
supabase
  .from("organization_members")
  .select("user_id, email")
  .eq("org_id", selectedOrgId)
```

With an RPC call:
```ts
supabase
  .rpc("get_org_members_with_email", { p_org_id: selectedOrgId })
```

Then map the results to set `orgMembers` with `user_id` and `email` from the RPC response. The dropdown will then display actual email addresses instead of user IDs.

