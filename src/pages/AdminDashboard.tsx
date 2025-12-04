import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeachersManager from "@/components/admin/TeachersManager";
import StudentsManager from "@/components/admin/StudentsManager";
import ClassesManager from "@/components/admin/ClassesManager";
import MessagingSystem from "@/components/shared/MessagingSystem";
import SettingsPage from "@/components/admin/SettingsPage";
import StudentEnrollment from "@/components/admin/StudentEnrollment";
import ExamManager from "@/components/admin/ExamManager";
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
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
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
        
        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible -mx-3 sm:mx-0 px-3 sm:px-0 lg:space-y-2 lg:mt-8">
          <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </Button>
          <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm">
            <School className="mr-2 h-4 w-4" />
            Class Management
          </Button>
          <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button variant="ghost" className="lg:w-full justify-start whitespace-nowrap text-xs sm:text-sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        <div className="hidden lg:block absolute bottom-4 w-56">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
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

        <Tabs defaultValue="requests" className="space-y-4">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="requests" className="text-xs sm:text-sm whitespace-nowrap">Teacher Requests</TabsTrigger>
              <TabsTrigger value="teachers" className="text-xs sm:text-sm whitespace-nowrap">Teachers</TabsTrigger>
              <TabsTrigger value="students" className="text-xs sm:text-sm whitespace-nowrap">Students</TabsTrigger>
              <TabsTrigger value="enrollment" className="text-xs sm:text-sm whitespace-nowrap">Enrollment</TabsTrigger>
              <TabsTrigger value="classes" className="text-xs sm:text-sm whitespace-nowrap">Classes</TabsTrigger>
              <TabsTrigger value="exams" className="text-xs sm:text-sm whitespace-nowrap">Exams</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm whitespace-nowrap">Messages</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm whitespace-nowrap">Settings</TabsTrigger>
              <TabsTrigger value="diagnostics" className="text-xs sm:text-sm whitespace-nowrap">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Policy Diagnostics</span>
                <span className="sm:hidden">Policy</span>
              </TabsTrigger>
              <TabsTrigger value="data-diagnostics" className="text-xs sm:text-sm whitespace-nowrap">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Data Diagnostics</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              <TabsTrigger value="schema-diagnostics" className="text-xs sm:text-sm whitespace-nowrap">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Schema Diagnostics</span>
                <span className="sm:hidden">Schema</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">Users</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Approval Requests</CardTitle>
                <CardDescription>Review and approve teacher registration requests</CardDescription>
              </CardHeader>
              <CardContent>
                {teacherRequests.length === 0 ? (
                  <p className="text-muted-foreground">No pending requests</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.full_name}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>{request.phone || "N/A"}</TableCell>
                          <TableCell>{request.subject || "N/A"}</TableCell>
                          <TableCell>{request.qualification || "N/A"}</TableCell>
                          <TableCell>{request.experience || "N/A"}</TableCell>
                          <TableCell className="max-w-xs truncate">{request.reason || "N/A"}</TableCell>
                          <TableCell>
                            {request.status === "pending" && (
                              <Badge variant="outline" className="bg-yellow-100">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            {request.status === "approved" && (
                              <Badge variant="outline" className="bg-green-100">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approved
                              </Badge>
                            )}
                            {request.status === "rejected" && (
                              <Badge variant="outline" className="bg-red-100">
                                <XCircle className="mr-1 h-3 w-3" />
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleApproveTeacher(request.id, request.user_id)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectTeacher(request.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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