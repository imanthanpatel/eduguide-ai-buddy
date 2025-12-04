-- Comprehensive policy fix for all tables
-- This migration resolves all policy issues and ensures proper access controls

-- Disable RLS temporarily to avoid conflicts
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_analytics DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;

DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;

DROP POLICY IF EXISTS "Students can view own analytics" ON public.student_analytics;
DROP POLICY IF EXISTS "Teachers can view student analytics" ON public.student_analytics;
DROP POLICY IF EXISTS "Teachers and admins can manage analytics" ON public.student_analytics;

-- Recreate user_roles policies
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Recreate profiles policies
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Recreate classes policies
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_enrollments.class_id = classes.id 
      AND class_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view classes" ON public.classes
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Recreate class_enrollments policies
CREATE POLICY "Students can view own enrollments" ON public.class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_enrollments.class_id 
      AND classes.teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Recreate student_analytics policies
CREATE POLICY "Students can view own analytics" ON public.student_analytics
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view student analytics" ON public.student_analytics
  FOR SELECT USING (
    student_id IN (
      SELECT DISTINCT ce.student_id 
      FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Teachers and admins can manage analytics" ON public.student_analytics
  FOR ALL USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_analytics ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_enrollments TO authenticated;
GRANT ALL ON public.student_analytics TO authenticated;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = _user_id
    AND user_roles.role = _role
  );
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;