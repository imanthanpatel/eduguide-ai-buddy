import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TeachersManager from "@/components/admin/TeachersManager";
import StudentsManager from "@/components/admin/StudentsManager";
import ClassesManager from "@/components/admin/ClassesManager";
import MessagingSystem from "@/components/shared/MessagingSystem";
import SettingsPage from "@/components/admin/SettingsPage";
import StudentEnrollment from "@/components/admin/StudentEnrollment";
import ExamManager from "@/components/admin/ExamManager";
import ReportsManager from "@/components/admin/ReportsManager";
import PolicyDiagnostic from "@/components/admin/PolicyDiagnostic";
import DataFetchDiagnostic from "@/components/DataFetchDiagnostic";
import SchemaDiagnostic from "@/components/admin/SchemaDiagnostic";
import UserManagement from "@/components/admin/UserManagement";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  School, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [teacherRequests, setTeacherRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
    totalClasses: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is an admin
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (rolesData || []).map((r: any) => r.role);

      if (!roles.includes("admin")) {
        toast.error("Access denied. Admins only.");
        navigate("/dashboard");
        return;
      }

      await loadDashboardData();
    } catch (error: any) {
      toast.error("Error loading dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Load teacher requests
    const { data: requests } = await supabase
      .from("teacher_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setTeacherRequests(requests || []);

    // Load all users with roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `);

    setUsers(rolesData || []);

    // Load all classes
    const { data: classesData } = await supabase
      .from("classes")
      .select("*");

    setClasses(classesData || []);

    // Calculate stats
    const studentCount = rolesData?.filter(r => r.role === "student").length || 0;
    const teacherCount = rolesData?.filter(r => r.role === "teacher").length || 0;
    const pendingCount = requests?.filter(r => r.status === "pending").length || 0;

    setStats({
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      pendingRequests: pendingCount,
      totalClasses: classesData?.length || 0,
    });
  };

  const handleApproveTeacher = async (requestId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get teacher request details first
      const { data: requestData, error: fetchError } = await supabase
        .from("teacher_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from("teacher_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Assign teacher role with improved error handling
      try {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "teacher",
          });

        // Handle case where role might already exist
        if (roleError && !roleError.message.includes("duplicate")) {
          console.warn("Role assignment warning:", roleError.message);
          // Continue with the process even if role assignment has a minor issue
        }
      } catch (roleError) {
        console.error("Role assignment error:", roleError);
        // Don't stop the process for role assignment issues
      }

      // Move to teachers table
      const { error: teacherError } = await supabase
        .from("teachers")
        .insert({
          user_id: userId,
          full_name: requestData.full_name,
          email: requestData.email,
          phone: requestData.phone,
          qualification: requestData.qualification,
          experience: requestData.experience,
          subject: requestData.subject,
        });

      if (teacherError) throw teacherError;

      toast.success("Teacher approved and added to teachers table!");
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error approving teacher:", error);
      toast.error("Error approving teacher: " + error.message);
    }
  };

  const handleRejectTeacher = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("teacher_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Teacher request rejected");
      await loadDashboardData();
    } catch (error: any) {
      toast.error("Error rejecting teacher");
      console.error(error);
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
            <p className="text-xs sm:text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex lg:flex-col gap-2 lg:space-y-2 lg:mt-8">
          {/* Commented out - Not currently in use */}
          {/* <Button 
            variant="ghost" 
            className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm"
            onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
              const usersTab = Array.from(tabsList?.querySelectorAll('[role="tab"]') || []).find(
                (tab: any) => tab.textContent?.includes('Users')
              ) as HTMLElement;
              usersTab?.click();
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            User Management
          </Button> */}
          {/* <Button 
            variant="ghost" 
            className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm"
            onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
              const classesTab = Array.from(tabsList?.querySelectorAll('[role="tab"]') || []).find(
                (tab: any) => tab.textContent?.includes('Classes')
              ) as HTMLElement;
              classesTab?.click();
            }}
          >
            <School className="mr-2 h-4 w-4" />
            Class Management
          </Button> */}
          {/* <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button> */}
          {/* <Button 
            variant="ghost" 
            className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm"
            onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
              const reportsTab = Array.from(tabsList?.querySelectorAll('[role="tab"]') || []).find(
                (tab: any) => tab.textContent?.includes('Reports')
              ) as HTMLElement;
              reportsTab?.click();
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button> */}
          {/* <Button 
            variant="ghost" 
            className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm"
            onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
              const settingsTab = Array.from(tabsList?.querySelectorAll('[role="tab"]') || []).find(
                (tab: any) => tab.textContent?.includes('Settings')
              ) as HTMLElement;
              settingsTab?.click();
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
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
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage the entire EduGuide AI platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalTeachers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalClasses}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Mobile Dropdown */}
          <div className="lg:hidden">
            <Select value={activeTab} onValueChange={(value) => {
              if (value === "requests") {
                navigate("/admin/teacher-requests");
              } else {
                setActiveTab(value);
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requests">Teacher Requests</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="classes">Classes</SelectItem>
                <SelectItem value="exams">Exams</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                <SelectItem value="messages">Messages</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="diagnostics">Policy Diagnostics</SelectItem>
                <SelectItem value="data-diagnostics">Data Diagnostics</SelectItem>
                <SelectItem value="schema-diagnostics">Schema Diagnostics</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Card Navigation */}
          <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-3">
            <Card 
              className="cursor-pointer transition-all hover:shadow-md hover:bg-accent/50"
              onClick={() => navigate("/admin/teacher-requests")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Teacher Requests</p>
                    <p className="text-xs text-muted-foreground">Review requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "teachers" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("teachers")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Teachers</p>
                    <p className="text-xs text-muted-foreground">Manage teachers</p>
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
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Students</p>
                    <p className="text-xs text-muted-foreground">Manage students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "enrollment" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("enrollment")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Enrollment</p>
                    <p className="text-xs text-muted-foreground">Student enrollment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "classes" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("classes")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <School className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Classes</p>
                    <p className="text-xs text-muted-foreground">Manage classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "exams" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("exams")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Exams</p>
                    <p className="text-xs text-muted-foreground">Manage exams</p>
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
                    <p className="text-xs text-muted-foreground">View reports</p>
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
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "settings" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("settings")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-500/10">
                    <Settings className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Settings</p>
                    <p className="text-xs text-muted-foreground">App settings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "diagnostics" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("diagnostics")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Policy Diagnostics</p>
                    <p className="text-xs text-muted-foreground">Check policies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "data-diagnostics" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("data-diagnostics")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Data Diagnostics</p>
                    <p className="text-xs text-muted-foreground">Check data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "schema-diagnostics" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("schema-diagnostics")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Schema Diagnostics</p>
                    <p className="text-xs text-muted-foreground">Check schema</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "users" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
              onClick={() => setActiveTab("users")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <Users className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Users</p>
                    <p className="text-xs text-muted-foreground">Manage users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Requests is now a separate page - navigate to /admin/teacher-requests */}

          <TabsContent value="teachers">
            <TeachersManager />
          </TabsContent>

          <TabsContent value="students">
            <StudentsManager />
          </TabsContent>

          <TabsContent value="enrollment">
            <StudentEnrollment />
          </TabsContent>

          <TabsContent value="classes">
            <ClassesManager />
          </TabsContent>

          <TabsContent value="exams">
            <ExamManager />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManager />
          </TabsContent>

          <TabsContent value="messages">
            <MessagingSystem />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>

          <TabsContent value="diagnostics">
            <PolicyDiagnostic />
          </TabsContent>

          <TabsContent value="data-diagnostics">
            <DataFetchDiagnostic />
          </TabsContent>

          <TabsContent value="schema-diagnostics">
            <SchemaDiagnostic />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;