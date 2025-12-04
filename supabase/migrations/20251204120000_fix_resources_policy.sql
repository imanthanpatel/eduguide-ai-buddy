-- Fix resources table RLS policy to allow INSERT operations
-- The existing policy is missing WITH CHECK clause for INSERT

-- Drop all existing policies on resources
DROP POLICY IF EXISTS "Teachers and admins can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view resources" ON public.resources;

-- Recreate view policy (everyone can view resources)
CREATE POLICY "Users can view resources" ON public.resources
  FOR SELECT USING (true);

-- Recreate manage policy with both USING and WITH CHECK clauses
-- This allows teachers and admins to INSERT, UPDATE, and DELETE resources
CREATE POLICY "Teachers and admins can manage resources" ON public.resources
  FOR ALL 
  USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Clean up any invalid foreign key values
UPDATE public.resources 
SET uploaded_by = NULL 
WHERE uploaded_by IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = resources.uploaded_by
);

UPDATE public.resources 
SET class_id = NULL 
WHERE class_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id = resources.class_id
);

