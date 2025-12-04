-- Function to reset all policies on classes table if needed
CREATE OR REPLACE FUNCTION public.reset_classes_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop all existing policies on classes table
  DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
  DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
  DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
  
  -- Drop all existing policies on class_enrollments table
  DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_enrollments;
  DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_enrollments;
  DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;
  
  -- Drop student analytics policies that might cause recursion
  DROP POLICY IF EXISTS "Teachers can view student analytics" ON public.student_analytics;
  
  -- Recreate policies with safe versions
  CREATE POLICY "Teachers can view classes" ON public.classes
    FOR SELECT USING (
      public.has_role(auth.uid(), 'teacher') OR 
      public.has_role(auth.uid(), 'admin')
    );
    
  CREATE POLICY "Students can view enrolled classes" ON public.classes
    FOR SELECT USING (
      id IN (
        SELECT class_id FROM public.class_enrollments 
        WHERE student_id = auth.uid()
      )
    );
    
  CREATE POLICY "Admins can manage classes" ON public.classes
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    
  -- Recreate class_enrollments policies
  CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
    FOR SELECT USING (
      class_id IN (
        SELECT id FROM public.classes 
        WHERE teacher_id = auth.uid()
      ) OR public.has_role(auth.uid(), 'admin')
    );
    
  CREATE POLICY "Students can view own enrollments" ON public.class_enrollments
    FOR SELECT USING (auth.uid() = student_id);
    
  CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    
  -- Recreate student analytics policies
  CREATE POLICY "Teachers can view student analytics" ON public.student_analytics
    FOR SELECT USING (
      student_id IN (
        SELECT DISTINCT ce.student_id 
        FROM public.class_enrollments ce
        JOIN public.classes c ON ce.class_id = c.id
        WHERE c.teacher_id = auth.uid()
      ) OR public.has_role(auth.uid(), 'admin')
    );
    
  CREATE POLICY "Students can view own analytics" ON public.student_analytics
    FOR SELECT USING (auth.uid() = student_id);
    
  CREATE POLICY "Teachers and admins can manage analytics" ON public.student_analytics
    FOR ALL USING (
      public.has_role(auth.uid(), 'teacher') OR 
      public.has_role(auth.uid(), 'admin')
    );
END;
$$;