
-- Add columns to ai_queries
ALTER TABLE public.ai_queries
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS document_id uuid;

-- Enable RLS
ALTER TABLE public.ai_queries ENABLE ROW LEVEL SECURITY;

-- Members can view AI queries for projects they can access
CREATE POLICY "Members can view ai queries"
  ON public.ai_queries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.org_id = p.org_id
      WHERE p.id = ai_queries.project_id
        AND om.user_id = auth.uid()
    )
  );

-- Allow inserts from authenticated users for their own queries
CREATE POLICY "Authenticated users can insert ai queries"
  ON public.ai_queries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
