import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { handleSupabaseError, withErrorHandling } from "@/lib/errorHandler";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  qualification: string | null;
  experience: string | null;
  created_at: string | null;
  approved_at: string | null;
  user_id: string | null;
}

export default function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    qualification: "",
    experience: "",
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      handleSupabaseError(error, "Load Teachers", toast);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const operation = editingTeacher ? "Update Teacher" : "Add Teacher";
    
    const { error } = await withErrorHandling(
      operation,
      async () => {
        if (editingTeacher) {
          const { error } = await supabase
            .from("teachers")
            .update(formData)
            .eq("id", editingTeacher.id);

          if (error) throw error;
          toast.success("Teacher updated successfully");
        } else {
          const { error } = await supabase
            .from("teachers")
            .insert([formData]);

          if (error) throw error;
          toast.success("Teacher added successfully");
        }

        setDialogOpen(false);
        setEditingTeacher(null);
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          subject: "",
          qualification: "",
          experience: "",
        });
        loadTeachers();
      },
      toast
    );

    if (error) {
      // Error already handled by withErrorHandling
      return;
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email,
      phone: teacher.phone || "",
      subject: teacher.subject || "",
      qualification: teacher.qualification || "",
      experience: teacher.experience || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;

    const { error } = await withErrorHandling(
      "Delete Teacher",
      async () => {
        const { error } = await supabase
          .from("teachers")
          .delete()
          .eq("id", id);

        if (error) throw error;
        toast.success("Teacher deleted successfully");
        loadTeachers();
      },
      toast
    );

    if (error) {
      // Error already handled by withErrorHandling
      return;
    }
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      subject: "",
      qualification: "",
      experience: "",
    });
    setDialogOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Teachers Management</CardTitle>
            <CardDescription>Manage teachers and their information</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.full_name}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.subject || "N/A"}</TableCell>
                <TableCell>{teacher.qualification || "N/A"}</TableCell>
                <TableCell>{teacher.experience || "N/A"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(teacher.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
              <DialogDescription>
                {editingTeacher ? "Edit the teacher's information" : "Add a new teacher to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +1234567890"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., B.Ed, M.Sc"
                />
              </div>
              <div>
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g., 5 years teaching experience"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                {editingTeacher ? "Update Teacher" : "Add Teacher"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}