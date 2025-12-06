import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Send, FileText } from "lucide-react";
import { createNotificationWithEmailSMS } from "@/lib/sendNotification";

interface Report {
  id: string;
  title: string;
  description: string | null;
  report_type: string;
  user_id: string | null;
  class_id: string | null;
  report_url: string | null;
  report_data: any;
  generated_by: string | null;
  created_at: string;
}

interface Class {
  id: string;
  name: string;
  subject: string | null;
  section: string | null;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string | null;
  class_id: string;
}

export default function ReportsManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    report_type: "progress",
    class_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedClass]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if user is admin or teacher
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id);

      const roles = (rolesData || []).map((r: any) => r.role);
      const isAdmin = roles.includes("admin");
      const isTeacher = roles.includes("teacher");

      // Load reports
      let reportsQuery = supabase.from("reports").select("*");
      
      if (isTeacher && !isAdmin) {
        // Teachers can only see reports they created
        reportsQuery = reportsQuery.eq("generated_by", user?.id);
      }
      
      const { data: reportsData, error: reportsError } = await reportsQuery
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Load classes
      let classesQuery = supabase.from("classes").select("id, name, subject, section");
      
      if (isTeacher && !isAdmin) {
        // Teachers can only see their own classes
        classesQuery = classesQuery.eq("teacher_id", user?.id);
      }
      
      const { data: classesData, error: classesError } = await classesQuery
        .order("name", { ascending: true });

      if (classesError) throw classesError;

      setReports(reportsData || []);
      setClasses(classesData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForClass = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          id,
          student_id,
          class_id,
          profiles:student_id (full_name)
        `)
        .eq("class_id", classId);

      if (error) throw error;

      const studentsData = (data || []).map((enrollment: any) => ({
        id: enrollment.id,
        user_id: enrollment.student_id,
        full_name: enrollment.profiles?.full_name || "Unknown Student",
        class_id: enrollment.class_id,
      }));

      setStudents(studentsData);
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast.error(`Error loading students: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      if (!formData.title || formData.title.trim() === "") {
        toast.error("Report title is required");
        setSaving(false);
        return;
      }

      if (!formData.class_id) {
        toast.error("Please select a class");
        setSaving(false);
        return;
      }

      if (selectedStudents.length === 0) {
        toast.error("Please select at least one student");
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        setSaving(false);
        return;
      }

      // Create reports for each selected student
      const reportsToCreate = selectedStudents.map((studentId) => ({
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        report_type: formData.report_type,
        user_id: studentId,
        class_id: formData.class_id,
        generated_by: user.id,
        report_data: {
          sent_at: new Date().toISOString(),
        },
      }));

      const { data: createdReports, error: insertError } = await supabase
        .from("reports")
        .insert(reportsToCreate)
        .select();

      if (insertError) {
        console.error("Insert error details:", insertError);
        toast.error(`Failed to create reports: ${insertError.message}`);
        setSaving(false);
        return;
      }

      // Send notifications to students
      for (const report of createdReports || []) {
        const student = students.find((s) => s.user_id === report.user_id);
        const studentName = student?.full_name || "Student";

        await createNotificationWithEmailSMS(
          report.user_id!,
          `New Report: ${report.title}`,
          `You have received a new ${report.report_type} report from your teacher. ${formData.description ? `\n\n${formData.description}` : ""}`,
          "info"
        );
      }

      toast.success(`Report sent to ${selectedStudents.length} student(s) successfully!`);
      setDialogOpen(false);
      setEditingReport(null);
      setFormData({
        title: "",
        description: "",
        report_type: "progress",
        class_id: "",
      });
      setSelectedClass("");
      setSelectedStudents([]);
      loadData();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Save failed: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const { error } = await supabase.from("reports").delete().eq("id", id);

      if (error) throw new Error(`Delete error: ${error.message}`);
      toast.success("Report deleted successfully");
      loadData();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Delete failed: ${error.message || "Unknown error"}`);
    }
  };

  const handleAddNew = () => {
    setEditingReport(null);
    setFormData({
      title: "",
      description: "",
      report_type: "progress",
      class_id: "",
    });
    setSelectedClass("");
    setSelectedStudents([]);
    setDialogOpen(true);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.user_id));
    }
  };

  const getReportTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      progress: "bg-blue-100 text-blue-800",
      behavior: "bg-yellow-100 text-yellow-800",
      academic: "bg-green-100 text-green-800",
      attendance: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.other;
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Reports Management</CardTitle>
            <CardDescription>Create and send reports to students</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No reports created yet. Click "Create Report" to get started.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>
                    <Badge className={getReportTypeBadge(report.report_type)}>
                      {report.report_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {classes.find((c) => c.id === report.class_id)?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.user_id ? (
                      <span className="text-sm">Student ID: {report.user_id.substring(0, 8)}...</span>
                    ) : (
                      "All Students"
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Create a report and send it to selected students in a class
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Progress Report - Q1 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="report_type">Report Type *</Label>
                <Select
                  value={formData.report_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, report_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">Progress Report</SelectItem>
                    <SelectItem value="behavior">Behavior Report</SelectItem>
                    <SelectItem value="academic">Academic Report</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class_id">Select Class *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, class_id: value });
                    setSelectedClass(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ""}
                        {cls.subject ? ` (${cls.subject})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClass && students.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Students *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedStudents.length === students.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {students.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`student-${student.user_id}`}
                          checked={selectedStudents.includes(student.user_id)}
                          onCheckedChange={() =>
                            toggleStudentSelection(student.user_id)
                          }
                        />
                        <Label
                          htmlFor={`student-${student.user_id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {student.full_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedStudents.length} student(s) selected
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Add additional details about the report..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingReport(null);
                  setFormData({
                    title: "",
                    description: "",
                    report_type: "progress",
                    class_id: "",
                  });
                  setSelectedClass("");
                  setSelectedStudents([]);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Send className="mr-2 h-4 w-4" />
                {saving ? "Sending..." : "Send Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

