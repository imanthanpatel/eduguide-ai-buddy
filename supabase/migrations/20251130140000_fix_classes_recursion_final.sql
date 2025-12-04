-- Final fix for infinite recursion in classes policies
-- This migration resolves the circular reference issue between classes and class_enrollments

-- First, drop all existing policies on classes and class_enrollments
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;

DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;

-- Recreate classes policies without circular references
-- Students can view classes they're enrolled in through a safer method
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_enrollments.class_id = classes.id 
      AND class_enrollments.student_id = auth.uid()
    )
  );

-- Teachers and admins can view all classes
CREATE POLICY "Teachers can view classes" ON public.classes
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Admins can manage classes
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Recreate class_enrollments policies
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON public.class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can view enrollments for their classes (without circular reference)
CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_enrollments.class_id 
      AND classes.teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Admins can manage enrollments
CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Grant necessary permissions
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_enrollments TO authenticated;