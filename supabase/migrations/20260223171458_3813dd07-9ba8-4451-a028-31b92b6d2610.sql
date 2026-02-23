
-- Allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert themselves as org members
CREATE POLICY "Users can insert themselves as org members"
ON public.organization_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);
