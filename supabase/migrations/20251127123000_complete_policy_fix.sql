-- Complete policy fix to resolve infinite recursion issues
-- This migration applies all necessary fixes in the correct order

-- First, drop all potentially problematic policies
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Teachers can view student analytics" ON public.student_analytics;

-- Recreate the classes policy with a safe version
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM public.class_enrollments 
      WHERE student_id = auth.uid()
    )
  );

-- Recreate the class_enrollments policy with a safe version
CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM public.classes 
      WHERE teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Recreate the student_analytics policy with a safe version
CREATE POLICY "Teachers can view student analytics" ON public.student_analytics
  FOR SELECT USING (
    student_id IN (
      SELECT DISTINCT ce.student_id 
      FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Ensure all other policies are in place
-- classes: Teachers and admins can view all classes
DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
CREATE POLICY "Teachers can view classes" ON public.classes
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- classes: Admins can manage classes
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- class_enrollments: Students can view own enrollments
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_enrollments;
CREATE POLICY "Students can view own enrollments" ON public.class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

-- class_enrollments: Admins can manage enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- student_analytics: Students can view own analytics
DROP POLICY IF EXISTS "Students can view own analytics" ON public.student_analytics;
CREATE POLICY "Students can view own analytics" ON public.student_analytics
  FOR SELECT USING (auth.uid() = student_id);

-- student_analytics: Teachers and admins can insert/update analytics
DROP POLICY IF EXISTS "Teachers and admins can manage analytics" ON public.student_analytics;
CREATE POLICY "Teachers and admins can manage analytics" ON public.student_analytics
  FOR ALL USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );