-- Fix infinite recursion in classes policy by rewriting the student policy
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;

-- Create a new policy that avoids recursion
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM public.class_enrollments 
      WHERE student_id = auth.uid()
    )
  );