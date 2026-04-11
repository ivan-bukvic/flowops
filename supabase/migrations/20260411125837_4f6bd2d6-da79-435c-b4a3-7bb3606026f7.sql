
-- Allow owners and admins to update organization name
CREATE POLICY "Owners and admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
  )
);

-- Allow owners and admins to update member roles
CREATE POLICY "Owners and admins can update members"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

-- Allow owners and admins to remove members
CREATE POLICY "Owners and admins can delete members"
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);
