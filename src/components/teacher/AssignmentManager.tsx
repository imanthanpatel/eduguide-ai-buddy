import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Calendar } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  total_marks: number | null;
  class_id: string;
  teacher_id: string;
  created_at: string | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
}

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    total_marks: "100",
    class_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [assignmentsRes, classesRes] = await Promise.all([
        supabase
          .from("assignments")
          .select("*")
          .eq("teacher_id", user?.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("classes")
          .select("*")
          .eq("teacher_id", user?.id)
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (classesRes.error) throw classesRes.error;

      setAssignments(assignmentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error: any) {
      toast.error("Error loading data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (!formData.class_id) {
        toast.error("Please select a class");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Format due_date properly for Supabase (ISO string)
      let dueDate = null;
      if (formData.due_date) {
        // Convert datetime-local to ISO string
        dueDate = new Date(formData.due_date).toISOString();
      }

      const assignmentData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: dueDate,
        total_marks: formData.total_marks ? parseInt(formData.total_marks) : 100,
        class_id: formData.class_id,
        teacher_id: user?.id,
      };

      if (editingAssignment) {
        const { error } = await supabase
          .from("assignments")
          .update(assignmentData)
          .eq("id", editingAssignment.id);

        if (error) throw error;
        toast.success("Assignment updated successfully");
      } else {
        const { error } = await supabase
          .from("assignments")
          .insert([assignmentData]);

        if (error) throw error;
        toast.success("Assignment created successfully");
      }

      setDialogOpen(false);
      setEditingAssignment(null);
      setFormData({
        title: "",
        description: "",
        due_date: "",
        total_marks: "100",
        class_id: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error saving assignment");
      console.error(error);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:mm)
    let dueDateValue = "";
    if (assignment.due_date) {
      const date = new Date(assignment.due_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      dueDateValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      due_date: dueDateValue,
      total_marks: assignment.total_marks?.toString() || "100",
      class_id: assignment.class_id,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Assignment deleted successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNew = () => {
    setEditingAssignment(null);
    setFormData({
      title: "",
      description: "",
      due_date: "",
      total_marks: "100",
      class_id: "",
    });
    setDialogOpen(true);
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ` - Section ${cls.section}` : ""}` : "Unknown";
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Assignments Manager</CardTitle>
            <CardDescription>Create and manage assignments for your classes</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No assignments created yet.</p>
            <p className="text-sm mt-1">Click "New Assignment" to create your first assignment.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{getClassName(assignment.class_id)}</TableCell>
                  <TableCell>
                    {assignment.due_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                    ) : (
                      "No deadline"
                    )}
                  </TableCell>
                  <TableCell>{assignment.total_marks || 100}</TableCell>
                  <TableCell>
                    {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(assignment)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(assignment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create New Assignment"}</DialogTitle>
              <DialogDescription>
                {editingAssignment ? "Update the assignment details" : "Create a new assignment for your students"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Chapter 5 Homework"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment instructions and requirements..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class_id">Class *</Label>
                  <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}{cls.section ? ` - Section ${cls.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total_marks">Total Marks</Label>
                  <Input
                    id="total_marks"
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                {editingAssignment ? "Update Assignment" : "Create Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

