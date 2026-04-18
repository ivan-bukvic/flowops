ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'PROJECT_MEMBER_UPDATED';

CREATE POLICY "Org owners and admins can update project members"
ON public.project_members FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM projects p
  JOIN organization_members om ON om.org_id = p.org_id
  WHERE p.id = project_members.project_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin')
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM projects p
  JOIN organization_members om ON om.org_id = p.org_id
  WHERE p.id = project_members.project_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin')
));