import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Home
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TeacherRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherRequests, setTeacherRequests] = useState<any[]>([]);

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

      await loadTeacherRequests();
    } catch (error: any) {
      toast.error("Error loading page");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherRequests = async () => {
    const { data: requests } = await supabase
      .from("teacher_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setTeacherRequests(requests || []);
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

      // Assign teacher role
      try {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "teacher",
          });

        if (roleError && !roleError.message.includes("duplicate")) {
          console.warn("Role assignment warning:", roleError.message);
        }
      } catch (roleError) {
        console.error("Role assignment error:", roleError);
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
      await loadTeacherRequests();
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
      await loadTeacherRequests();
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
    <div className="min-h-screen bg-background">
      {/* Header with Breadcrumb */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/admin-dashboard" className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Teacher Requests</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Teacher Approval Requests</h1>
          <p className="text-muted-foreground">Review and approve teacher registration requests</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Review and approve teacher registration requests</CardDescription>
          </CardHeader>
          <CardContent>
            {teacherRequests.length === 0 ? (
              <p className="text-muted-foreground">No pending requests</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[150px]">Email</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Phone</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">Subject</TableHead>
                    <TableHead className="min-w-[120px] hidden xl:table-cell">Qualification</TableHead>
                    <TableHead className="min-w-[100px] hidden xl:table-cell">Experience</TableHead>
                    <TableHead className="min-w-[150px] hidden lg:table-cell">Reason</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.full_name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{request.phone || "N/A"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{request.subject || "N/A"}</TableCell>
                        <TableCell className="hidden xl:table-cell">{request.qualification || "N/A"}</TableCell>
                        <TableCell className="hidden xl:table-cell">{request.experience || "N/A"}</TableCell>
                        <TableCell className="max-w-xs truncate hidden lg:table-cell">{request.reason || "N/A"}</TableCell>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherRequests;

