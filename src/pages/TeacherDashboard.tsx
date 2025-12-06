import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  BookOpen, 
  Bell, 
  LogOut,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import StudentAnalyticsView from "@/components/teacher/StudentAnalyticsView";
import AttendanceManager from "@/components/teacher/AttendanceManager";
import ResourcesManager from "@/components/teacher/ResourcesManager";
import AnnouncementsManager from "@/components/teacher/AnnouncementsManager";
import AssignmentManager from "@/components/teacher/AssignmentManager";
import ReportsManager from "@/components/admin/ReportsManager";
import MessagingSystem from "@/components/shared/MessagingSystem";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [teacherName, setTeacherName] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkTeacherApproval = async (userId: string) => {
    const { data: teacherData } = await supabase
      .from("teachers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!teacherData) {
      navigate("/teacher-pending");
      return false;
    }
    return true;
  };

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has teacher role (supports multi-role users)
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "teacher");

      if (!rolesData || rolesData.length === 0) {
        toast.error("Access denied. Teachers only.");
        navigate("/dashboard");
        return;
      }

      // Check if teacher is approved and in teachers table
      const isApproved = await checkTeacherApproval(user.id);
      if (!isApproved) return;

      // Get teacher profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setTeacherName(profile?.full_name || "Teacher");

      // Load teacher's classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id);

      setClasses(classesData || []);

      // Load students from all classes
      if (classesData && classesData.length > 0) {
        const classIds = classesData.map(c => c.id);
        const { data: enrollmentsData } = await supabase
          .from("class_enrollments")
          .select(`
            *,
            profiles:student_id (full_name, avatar_url)
          `)
          .in("class_id", classIds);

        setStudents(enrollmentsData || []);
      }

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      setAssignments(assignmentsData || []);

    } catch (error: any) {
      toast.error("Error loading dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r bg-card p-3 sm:p-4 space-y-3 sm:space-y-4 lg:relative">
        <div className="flex items-center justify-between lg:block">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">EduGuide AI</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Teacher Dashboard</p>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex lg:flex-col gap-2 lg:space-y-2 lg:mt-8">
          {/* Commented out - Not currently in use */}
          {/* <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm" onClick={() => {}}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button> */}
          {/* <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm" onClick={() => {}}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </Button> */}
          {/* <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm" onClick={() => {}}>
            <BookOpen className="mr-2 h-4 w-4" />
            Resources
          </Button> */}
          {/* <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm" onClick={() => {}}>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button> */}
        </nav>

        <div className="hidden lg:block absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Welcome, {teacherName}!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your classes and students</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Mobile Dropdown */}
          <div className="lg:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="assignments">Assignments</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
                <SelectItem value="announcements">Announcements</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                <SelectItem value="messages">Messages</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Card Navigation */}
          <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-3">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "overview" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("overview")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Overview</p>
                    <p className="text-xs text-muted-foreground">Dashboard summary</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "students" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("students")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Students</p>
                    <p className="text-xs text-muted-foreground">Manage students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "attendance" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("attendance")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Attendance</p>
                    <p className="text-xs text-muted-foreground">Track attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "assignments" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("assignments")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Assignments</p>
                    <p className="text-xs text-muted-foreground">Manage assignments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "resources" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("resources")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Resources</p>
                    <p className="text-xs text-muted-foreground">Learning resources</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "announcements" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("announcements")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Bell className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Announcements</p>
                    <p className="text-xs text-muted-foreground">Post announcements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "reports" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("reports")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <FileText className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Reports</p>
                    <p className="text-xs text-muted-foreground">Student reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "messages" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("messages")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <MessageSquare className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Messages</p>
                    <p className="text-xs text-muted-foreground">View messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "analytics" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("analytics")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <BarChart3 className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Analytics</p>
                    <p className="text-xs text-muted-foreground">Student analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{students.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{classes.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{assignments.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Classes</CardTitle>
                <CardDescription>Your teaching schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-muted-foreground">No classes assigned yet</p>
                ) : (
                  <div className="space-y-2">
                    {classes.map((cls) => (
                      <div key={cls.id} className="p-4 border rounded-lg">
                        <h3 className="font-semibold">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cls.subject} - Section {cls.section}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Student List</CardTitle>
                    <CardDescription>View and manage your students</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-muted-foreground">No students enrolled yet</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((enrollment) => (
                      <div key={enrollment.id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{enrollment.profiles?.full_name || "Student"}</p>
                            <p className="text-sm text-muted-foreground">
                              Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View Progress</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <AssignmentManager />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <AttendanceManager />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourcesManager />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <AnnouncementsManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportsManager />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <MessagingSystem />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <StudentAnalyticsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;
