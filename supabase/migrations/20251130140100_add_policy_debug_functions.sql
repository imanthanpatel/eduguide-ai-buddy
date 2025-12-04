-- Add functions to help debug policy issues

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = check_user_role.user_id
      AND user_roles.role::text = check_user_role.role_name
  );
$$;

-- Function to check if user is enrolled in a class
CREATE OR REPLACE FUNCTION public.is_user_enrolled_in_class(user_id UUID, class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_enrollments.student_id = is_user_enrolled_in_class.user_id
      AND class_enrollments.class_id = is_user_enrolled_in_class.class_id
  );
$$;

-- Function to check if user teaches a class
CREATE OR REPLACE FUNCTION public.is_user_teaching_class(user_id UUID, class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = is_user_teaching_class.class_id
      AND classes.teacher_id = is_user_teaching_class.user_id
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_enrolled_in_class(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_teaching_class(UUID, UUID) TO authenticated;
