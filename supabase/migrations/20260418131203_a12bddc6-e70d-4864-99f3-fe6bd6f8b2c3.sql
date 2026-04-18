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