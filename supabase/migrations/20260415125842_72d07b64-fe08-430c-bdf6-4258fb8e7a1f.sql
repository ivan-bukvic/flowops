
DROP FUNCTION IF EXISTS public.get_org_members_with_email(uuid);

CREATE FUNCTION public.get_org_members_with_email(p_org_id uuid)
 RETURNS TABLE(user_id uuid, email text, full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if not exists (
    select 1
    from organization_members om
    where om.org_id = p_org_id
      and om.user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  return query
  select 
    om.user_id,
    p.email,
    p.full_name
  from organization_members om
  left join profiles p on p.id = om.user_id
  where om.org_id = p_org_id;
end;
$function$;
