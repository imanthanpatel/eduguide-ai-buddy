import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Eye } from "lucide-react";

interface Student {
  id: string;
  full_name: string | null;
  email?: string;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
}

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
  profiles: {
    full_name: string | null;
    email?: string;
  };
  classes: {
    name: string;
    section: string | null;
    subject: string | null;
  };
}

export default function StudentEnrollment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewStudentDialogOpen, setViewStudentDialogOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Enrollment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadStudents(), loadClasses(), loadEnrollments()]);
  };

  const loadStudents = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) throw profilesError;

      // Enrich students with email data
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

      setStudents(enrichedStudents);
    } catch (error: any) {
      toast.error("Error loading students");
      console.error(error);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section, subject");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Error loading classes");
      console.error(error);
    }
  };

  const loadEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          *,
          classes(name, section, subject)
        `);

      if (error) throw error;

      // Get student names and emails separately
      const enrollmentsWithDetails = await Promise.all(
        (data || []).map(async (enrollment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", enrollment.student_id)
            .single();

          // Get email from auth
          let email = "N/A";
          try {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(enrollment.student_id);
            if (!userError && userData?.user?.email) {
              email = userData.user.email;
            }
          } catch (err) {
            console.warn(`Error fetching user data for ${enrollment.student_id}:`, err);
          }

          return {
            ...enrollment,
            profiles: { 
              full_name: profile?.full_name || null,
              email: email
            },
          };
        })
      );

      setEnrollments(enrollmentsWithDetails as any);
    } catch (error: any) {
      toast.error("Error loading enrollments");
      console.error(error);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudent || !selectedClass) {
      toast.error("Please select both student and class");
      return;
    }

    try {
      const { error } = await supabase
        .from("class_enrollments")
        .insert({
          student_id: selectedStudent,
          class_id: selectedClass,
        });

      if (error) throw error;

      toast.success("Student enrolled successfully");
      setDialogOpen(false);
      setSelectedStudent("");
      setSelectedClass("");
      loadEnrollments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;

      toast.success("Student unenrolled successfully");
      loadEnrollments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const viewStudentDetails = (enrollment: Enrollment) => {
    setSelectedStudentDetails(enrollment);
    setViewStudentDialogOpen(true);
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.classes?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Enrollment</h2>
          <p className="text-muted-foreground">Manage student class enrollments</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Enroll Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>View and manage student enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by student name, email, or class name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Enrolled Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>{enrollment.profiles?.full_name || "Unknown"}</TableCell>
                  <TableCell>{enrollment.profiles?.email || "N/A"}</TableCell>
                  <TableCell>{enrollment.classes?.name || "N/A"}</TableCell>
                  <TableCell>{enrollment.classes?.subject || "N/A"}</TableCell>
                  <TableCell>{enrollment.classes?.section || "-"}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewStudentDetails(enrollment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnenroll(enrollment.id)}
                      >
                        Unenroll
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
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
                      {student.full_name || "Unnamed Student"} ({student.email || "No email"})
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
                      {cls.name} - {cls.subject || "No subject"} ({cls.section ? `Section ${cls.section}` : "No section"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnrollStudent}>Enroll Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={viewStudentDialogOpen} onOpenChange={setViewStudentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Enrollment Details</DialogTitle>
            <DialogDescription>View detailed information about the student and their enrollment</DialogDescription>
          </DialogHeader>
          {selectedStudentDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Student Information</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p>{selectedStudentDetails.profiles?.full_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedStudentDetails.profiles?.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Class Information</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Class Name</p>
                      <p>{selectedStudentDetails.classes?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p>{selectedStudentDetails.classes?.subject || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Section</p>
                      <p>{selectedStudentDetails.classes?.section || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Enrollment Details</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollment Date</p>
                    <p>{new Date(selectedStudentDetails.enrolled_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollment ID</p>
                    <p className="font-mono text-sm">{selectedStudentDetails.id}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold">Other Enrollments</h3>
                <div className="mt-2">
                  {enrollments.filter(e => 
                    e.student_id === selectedStudentDetails.student_id && 
                    e.id !== selectedStudentDetails.id
                  ).length > 0 ? (
                    <div className="space-y-2">
                      {enrollments
                        .filter(e => 
                          e.student_id === selectedStudentDetails.student_id && 
                          e.id !== selectedStudentDetails.id
                        )
                        .map((enrollment) => (
                          <div key={enrollment.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between">
                              <p className="font-medium">{enrollment.classes?.name}</p>
                              <span className="text-sm bg-secondary px-2 py-1 rounded">
                                {enrollment.classes?.section || "No section"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {enrollment.classes?.subject || "No subject"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-muted-foreground">This student has no other enrollments.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewStudentDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}