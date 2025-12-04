-- Comprehensive fix for all database errors
-- This migration resolves:
-- 1. Infinite recursion in RLS policies
-- 2. Foreign key constraint issues
-- 3. All circular policy dependencies

-- First, drop ALL existing policies that might cause recursion
-- Classes policies
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;

-- Class enrollments policies
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;

-- Student analytics policies (also have circular dependencies)
DROP POLICY IF EXISTS "Teachers can view student analytics" ON public.student_analytics;
DROP POLICY IF EXISTS "Students can view own analytics" ON public.student_analytics;
DROP POLICY IF EXISTS "Teachers and admins can manage analytics" ON public.student_analytics;

-- Create a security definer function to check enrollments without triggering RLS recursion
-- This function bypasses RLS to check if a student is enrolled in a class
CREATE OR REPLACE FUNCTION public.is_student_enrolled(_student_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_enrollments
    WHERE student_id = _student_id
    AND class_id = _class_id
  );
$$;

-- Create a security definer function to check if a teacher owns a class
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_teacher_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = _class_id
    AND teacher_id = _teacher_id
  );
$$;

-- Create a security definer function to get student IDs for a teacher's classes
CREATE OR REPLACE FUNCTION public.get_teacher_student_ids(_teacher_id UUID)
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT ce.student_id), ARRAY[]::UUID[])
  FROM public.class_enrollments ce
  INNER JOIN public.classes c ON ce.class_id = c.id
  WHERE c.teacher_id = _teacher_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_student_enrolled(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_of_class(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_student_ids(UUID) TO authenticated;

-- Recreate classes policies without circular references
-- Students can view classes they're enrolled in (using security definer function)
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    public.is_student_enrolled(auth.uid(), id)
  );

-- Teachers and admins can view all classes
CREATE POLICY "Teachers can view classes" ON public.classes
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes" ON public.classes
  FOR SELECT USING (
    teacher_id = auth.uid()
  );

-- Admins can manage classes (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teachers can manage their own classes (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Teachers can manage own classes" ON public.classes
  FOR ALL 
  USING (
    teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher')
  )
  WITH CHECK (
    teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher')
  );

-- Recreate class_enrollments policies without circular references
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON public.class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can view enrollments for their classes (using security definer function to avoid recursion)
CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
  FOR SELECT USING (
    public.is_teacher_of_class(auth.uid(), class_id) OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Admins can manage enrollments (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Recreate student_analytics policies without circular references
-- Students can view their own analytics
CREATE POLICY "Students can view own analytics" ON public.student_analytics
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can view analytics for students in their classes (using security definer function)
CREATE POLICY "Teachers can view student analytics" ON public.student_analytics
  FOR SELECT USING (
    student_id = ANY(public.get_teacher_student_ids(auth.uid())) OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Teachers and admins can manage analytics (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Teachers and admins can manage analytics" ON public.student_analytics
  FOR ALL 
  USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Ensure teacher_id foreign key constraint allows NULL and validates properly
-- First, clean up any invalid teacher_id values
UPDATE public.classes 
SET teacher_id = NULL 
WHERE teacher_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = classes.teacher_id
);

-- Ensure created_by foreign key constraint allows NULL and validates properly
UPDATE public.classes 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = classes.created_by
);

