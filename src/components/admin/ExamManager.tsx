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
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string | null;
  duration_minutes: number | null;
  total_marks: number | null;
  syllabus: string | null;
  class_id: string;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

export default function ExamManager() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    date: "",
    time: "",
    duration_minutes: "",
    total_marks: "",
    syllabus: "",
    class_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadExams(), loadClasses()]);
  };

  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      toast.error("Error loading exams");
      console.error(error);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Error loading classes");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject || !formData.date || !formData.class_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const examData = {
        title: formData.title,
        subject: formData.subject,
        date: formData.date,
        time: formData.time || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        total_marks: formData.total_marks ? parseInt(formData.total_marks) : null,
        syllabus: formData.syllabus || null,
        class_id: formData.class_id,
      };

      if (editingExam) {
        const { error } = await supabase
          .from("exams")
          .update(examData)
          .eq("id", editingExam.id);

        if (error) throw error;
        toast.success("Exam updated successfully");
      } else {
        const { error } = await supabase
          .from("exams")
          .insert(examData);

        if (error) throw error;
        toast.success("Exam created successfully");
      }

      resetForm();
      loadExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      subject: exam.subject,
      date: exam.date,
      time: exam.time || "",
      duration_minutes: exam.duration_minutes?.toString() || "",
      total_marks: exam.total_marks?.toString() || "",
      syllabus: exam.syllabus || "",
      class_id: exam.class_id,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    try {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Exam deleted successfully");
      loadExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      date: "",
      time: "",
      duration_minutes: "",
      total_marks: "",
      syllabus: "",
      class_id: "",
    });
    setEditingExam(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exam Management</h2>
          <p className="text-muted-foreground">Create and manage exams</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exam
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>View and manage exam schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                  <TableCell>{exam.time || "-"}</TableCell>
                  <TableCell>{exam.duration_minutes ? `${exam.duration_minutes} mins` : "-"}</TableCell>
                  <TableCell>{exam.total_marks || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(exam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(exam.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Add New Exam"}</DialogTitle>
            <DialogDescription>Fill in the exam details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>
              <div>
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Class *</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Syllabus</Label>
              <Textarea
                value={formData.syllabus}
                onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingExam ? "Update Exam" : "Create Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}