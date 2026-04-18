CREATE POLICY "Org owners and admins can remove project members"
ON public.project_members FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM projects p
  JOIN organization_members om ON om.org_id = p.org_id
  WHERE p.id = project_members.project_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin')
));