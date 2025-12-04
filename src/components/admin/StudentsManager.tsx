import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, Eye, AlertTriangle } from "lucide-react";

interface Student {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  email?: string;
}

interface ClassEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string | null;
  classes: {
    name: string;
    subject: string | null;
    section: string | null;
  };
}

interface Class {
  id: string;
  name: string;
  subject: string | null;
  section: string | null;
}

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [viewStudentDialogOpen, setViewStudentDialogOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check Supabase health first
      const { healthy, error: healthError } = await checkSupabaseHealth();
      if (!healthy) {
        throw new Error(`Supabase connection issue: ${healthError}`);
      }

      // Get all students with their profile information
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Enrich students with email data from auth
      const enrichedStudents = await Promise.all(
        profiles?.map(async (profile) => {
          try {
            // Get user email from auth
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
            if (userError) {
              console.warn(`Could not fetch user data for ${profile.id}:`, userError);
              return { ...profile, email: "N/A" };
            }
            return { ...profile, email: userData?.user?.email || "N/A" };
          } catch (err) {
            console.warn(`Error fetching user data for ${profile.id}:`, err);
            return { ...profile, email: "N/A" };
          }
        }) || []
      );

      // Get all classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*");

      if (classesError) {
        if (classesError.message.includes("infinite recursion") || classesError.message.includes("policy")) {
          toast.error(
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>Database policy error detected. Please check the Diagnostics tab.</span>
            </div>
          );
          console.error("Policy error in classes:", classesError);
          setClasses([]);
        } else {
          throw new Error(`Classes fetch error: ${classesError.message}`);
        }
      } else {
        setClasses(classesData || []);
      }

      // Get all enrollments with class details
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("class_enrollments")
        .select(`
          *,
          classes(name, subject, section)
        `);

      if (enrollmentsError) {
        if (enrollmentsError.message.includes("infinite recursion") || enrollmentsError.message.includes("policy")) {
          toast.error(
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>Database policy error detected. Please check the Diagnostics tab.</span>
            </div>
          );
          console.error("Policy error in enrollments:", enrollmentsError);
          setEnrollments([]);
        } else {
          throw new Error(`Enrollments fetch error: ${enrollmentsError.message}`);
        }
      } else {
        setEnrollments(enrollmentsData || []);
      }

      setStudents(enrichedStudents);
    } catch (error: any) {
      console.error("Data loading error:", error);
      toast.error(`Error loading data: ${error.message || 'Unknown error'}`);
      
      // Show more detailed error for debugging
      if (error.details) {
        console.error("Error details:", error.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !selectedClass) {
      toast.error("Please select both student and class");
      return;
    }

    try {
      const { error } = await supabase
        .from("class_enrollments")
        .insert([{ student_id: selectedStudent, class_id: selectedClass }]);

      if (error) throw error;
      toast.success("Student enrolled successfully");
      setEnrollDialogOpen(false);
      setSelectedStudent("");
      setSelectedClass("");
      loadData();
    } catch (error: any) {
      toast.error(`Enrollment failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to unenroll this student?")) return;

    try {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;
      toast.success("Student unenrolled successfully");
      loadData();
    } catch (error: any) {
      toast.error(`Unenrollment failed: ${error.message || 'Unknown error'}`);
    }
  };

  const getStudentEnrollments = (studentId: string) => {
    return enrollments
      .filter(e => e.student_id === studentId)
      .map(e => e.classes);
  };

  const viewStudentDetails = (student: Student) => {
    setSelectedStudentDetails(student);
    setViewStudentDialogOpen(true);
  };

  const filteredStudents = students.filter(student =>
    (student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Students Management</CardTitle>
            <CardDescription>Manage students and class enrollments</CardDescription>
          </div>
          <Button onClick={() => setEnrollDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Enrolled Classes</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => {
              const studentEnrollments = getStudentEnrollments(student.id);
              return (
                <TableRow key={student.id}>
                  <TableCell>{student.full_name || "Unknown"}</TableCell>
                  <TableCell>{student.email || "N/A"}</TableCell>
                  <TableCell>
                    {studentEnrollments.length > 0
                      ? studentEnrollments.map((c: any) => `${c.name} (${c.section})`).join(", ")
                      : "No classes"}
                  </TableCell>
                  <TableCell>
                    {student.created_at ? new Date(student.created_at).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewStudentDetails(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student.id);
                          setEnrollDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll Student in Class</DialogTitle>
              <DialogDescription>Select a student and class to enroll</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name || "Unknown"} ({student.email || "No email"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject} ({cls.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEnroll}>Enroll</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Details Dialog */}
        <Dialog open={viewStudentDialogOpen} onOpenChange={setViewStudentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>View comprehensive information about the student</DialogDescription>
            </DialogHeader>
            {selectedStudentDetails && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Personal Information</h3>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p>{selectedStudentDetails.full_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{selectedStudentDetails.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Joined Date</p>
                        <p>
                          {selectedStudentDetails.created_at 
                            ? new Date(selectedStudentDetails.created_at).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Enrollment Summary</h3>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Total Classes Enrolled</p>
                      <p className="text-2xl font-bold">
                        {getStudentEnrollments(selectedStudentDetails.id).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Enrolled Classes</h3>
                  {getStudentEnrollments(selectedStudentDetails.id).length > 0 ? (
                    <div className="space-y-2">
                      {getStudentEnrollments(selectedStudentDetails.id).map((cls, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between">
                            <p className="font-medium">{cls.name}</p>
                            <span className="text-sm bg-secondary px-2 py-1 rounded">
                              {cls.section || "No section"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {cls.subject || "No subject specified"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">This student is not enrolled in any classes.</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewStudentDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Add the health check function locally since we can't import it
const checkSupabaseHealth = async () => {
  try {
    // Simple query to check connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase health check failed:', error);
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true, error: null };
  } catch (err) {
    console.error('Supabase health check error:', err);
    return { healthy: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};