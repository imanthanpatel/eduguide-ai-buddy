-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Teacher approval requests
CREATE TABLE public.teacher_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  qualification TEXT,
  experience TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  section TEXT,
  subject TEXT,
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Class enrollments (students in classes)
CREATE TABLE public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (class_id, student_id)
);

ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  total_marks INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Assignment submissions
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  submission_url TEXT,
  marks_obtained INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Messages (teacher-student chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Learning resources
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'video', 'link', 'document')),
  resource_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Student analytics (extended from progress_tracker)
CREATE TABLE public.student_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  chapter TEXT,
  performance_score NUMERIC,
  weak_areas TEXT[],
  learning_speed TEXT CHECK (learning_speed IN ('slow', 'average', 'fast')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles: Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- user_roles: Admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: Admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- teacher_requests: Users can view own requests
CREATE POLICY "Users can view own teacher requests" ON public.teacher_requests
  FOR SELECT USING (auth.uid() = user_id);

-- teacher_requests: Users can insert own requests
CREATE POLICY "Users can create teacher requests" ON public.teacher_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- teacher_requests: Admins can view/update all requests
CREATE POLICY "Admins can view all teacher requests" ON public.teacher_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update teacher requests" ON public.teacher_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- classes: Teachers and admins can view all classes
CREATE POLICY "Teachers can view classes" ON public.classes
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- classes: Students can view their enrolled classes - FIXED VERSION
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM public.class_enrollments 
      WHERE student_id = auth.uid()
    )
  );

-- classes: Admins can manage classes
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- class_enrollments: Teachers can view enrollments in their classes
CREATE POLICY "Teachers can view class enrollments" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE id = class_id AND teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- class_enrollments: Students can view own enrollments
CREATE POLICY "Students can view own enrollments" ON public.class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

-- class_enrollments: Admins can manage enrollments
CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- assignments: Teachers can manage their own assignments
CREATE POLICY "Teachers can manage own assignments" ON public.assignments
  FOR ALL USING (auth.uid() = teacher_id);

-- assignments: Students can view assignments in their classes
CREATE POLICY "Students can view class assignments" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_id = assignments.class_id AND student_id = auth.uid()
    )
  );

-- assignment_submissions: Students can manage own submissions
CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions
  FOR ALL USING (auth.uid() = student_id);

-- assignment_submissions: Teachers can view/grade submissions in their assignments
CREATE POLICY "Teachers can grade submissions" ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assignments 
      WHERE id = assignment_id AND teacher_id = auth.uid()
    )
  );

-- messages: Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- messages: Users can send messages
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- messages: Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- notifications: Users can view own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- notifications: Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- notifications: Admins and teachers can send notifications
CREATE POLICY "Teachers and admins can send notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- resources: Everyone can view resources
CREATE POLICY "Users can view resources" ON public.resources
  FOR SELECT USING (true);

-- resources: Teachers and admins can manage resources
CREATE POLICY "Teachers and admins can manage resources" ON public.resources
  FOR ALL USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- activity_logs: Only admins can view logs
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- activity_logs: System can insert logs (public insert for tracking)
CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- student_analytics: Teachers can view analytics of students in their classes
CREATE POLICY "Teachers can view student analytics" ON public.student_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.class_enrollments ce ON c.id = ce.class_id
      WHERE ce.student_id = student_analytics.student_id 
      AND c.teacher_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- student_analytics: Students can view own analytics
CREATE POLICY "Students can view own analytics" ON public.student_analytics
  FOR SELECT USING (auth.uid() = student_id);

-- student_analytics: Teachers and admins can insert/update analytics
CREATE POLICY "Teachers and admins can manage analytics" ON public.student_analytics
  FOR ALL USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );