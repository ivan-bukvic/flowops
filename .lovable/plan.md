

## Problem

The "Upload Document" button (line 108-112) creates a file input and triggers the file picker, but never attaches an `onchange` event listener. After the user selects a file, nothing happens because there's no upload logic.

## Plan

### 1. Add storage RLS policy (migration)

The `documents` storage bucket already exists but may lack upload policies. Create a migration that adds an INSERT policy on `storage.objects` allowing authenticated users to upload to the `documents` bucket.

```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');
```

### 2. Fix the upload handler in `src/pages/Documents.tsx`

Replace the empty `onAction` callback with a complete upload flow:

- Add `uploading` state
- Add `onchange` handler to the dynamically created file input
- Accept `.pdf`, `.docx`, `.txt` files only via `input.accept`
- On file selection:
  1. Set `uploading = true`
  2. Upload file to Supabase Storage (`documents` bucket) with a unique path: `{orgId}/{uuid}_{filename}`
  3. Get the public/signed URL
  4. Insert a row into the `documents` table with `org_id`, `file_url`, `uploaded_by` (from auth), `processing_status: 'uploaded'`
  5. Show success toast via `sonner`
  6. Re-fetch the documents list
  7. On error, show error toast
  8. Set `uploading = false`
- Import `useAuth` to get the current user ID
- Import `toast` from `sonner`
- Pass `uploading` state to show a loading indicator (disable the upload button or show spinner text)

### Files to modify
- `src/pages/Documents.tsx` — add upload logic
- New migration — storage RLS policies

No new components needed. Purely fixes the existing broken flow.

