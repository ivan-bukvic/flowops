ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE public.projects
ADD CONSTRAINT projects_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;