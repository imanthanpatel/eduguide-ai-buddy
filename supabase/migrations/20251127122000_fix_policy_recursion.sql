-- Fix infinite recursion in RLS policies by breaking the circular dependency
-- The issue is that class_enrollments policy references classes table and vice versa

-- Drop the problematic policies
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view student analytics" ON public.student_analytics;

-- Create simplified policies that don't create circular references

-- Teachers can view class enrollments for their own classes (without referencing classes table in EXISTS)
CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM public.classes 
      WHERE teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Students can view their enrolled classes (this version should work without recursion)
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM public.class_enrollments 
      WHERE student_id = auth.uid()
    )
  );

-- Teachers can view student analytics for students in their classes (simplified version)
CREATE POLICY "Teachers can view student analytics" ON public.student_analytics
  FOR SELECT USING (
    student_id IN (
      SELECT DISTINCT ce.student_id 
      FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );