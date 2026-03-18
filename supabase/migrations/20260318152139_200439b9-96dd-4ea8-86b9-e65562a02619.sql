CREATE POLICY "Members can view automation logs"
ON public.automation_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM automation_rules ar
    JOIN organization_members om ON om.org_id = ar.org_id
    WHERE ar.id = automation_logs.rule_id
      AND om.user_id = auth.uid()
  )
);