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
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Class {
  id: string;
  name: string;
  subject: string | null;
  section: string | null;
  description: string | null;
  teacher_id: string | null;
  created_at: string | null;
  created_by: string | null;
}

interface Teacher {
  id: string;
  full_name: string | null;
  user_id: string;
}

export default function ClassesManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    section: "",
    description: "",
    teacher_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [classesRes, teachersRes] = await Promise.all([
        supabase.from("classes").select("*").order("created_at", { ascending: false }),
        supabase.from("teachers").select("id, full_name, user_id")
      ]);

      if (classesRes.error) {
        // Handle the specific recursion error
        if (classesRes.error.message.includes("infinite recursion")) {
          toast.error("Database policy error: Please contact administrator. Error: " + classesRes.error.message);
          console.error("Infinite recursion detected in classes policy. This is a database configuration issue.");
        } else {
          throw new Error(`Classes fetch error: ${classesRes.error.message}`);
        }
      }
      
      if (teachersRes.error) throw new Error(`Teachers fetch error: ${teachersRes.error.message}`);

      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (error: any) {
      console.error("Data loading error:", error);
      toast.error(`Error loading data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Prevent double submission
    if (saving) return;

    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name || formData.name.trim() === "") {
        toast.error("Class name is required");
        setSaving(false);
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You must be logged in to create a class");
        setSaving(false);
        return;
      }

      // Prepare data for insertion/update
      // Convert empty string or "none" to null for teacher_id
      const teacherId = formData.teacher_id && 
                        formData.teacher_id.trim() !== "" && 
                        formData.teacher_id !== "none"
        ? formData.teacher_id.trim() 
        : null;

      const classData: any = {
        name: formData.name.trim(),
        subject: formData.subject?.trim() || null,
        section: formData.section?.trim() || null,
        description: formData.description?.trim() || null,
        teacher_id: teacherId,
      };

      // Only set created_by for new classes
      if (!editingClass) {
        classData.created_by = user.id;
      }

      if (editingClass) {
        const { data, error } = await supabase
          .from("classes")
          .update(classData)
          .eq("id", editingClass.id)
          .select();

        if (error) {
          console.error("Update error details:", error);
          toast.error(`Update failed: ${error.message}`);
          setSaving(false);
          return;
        }
        
        if (data && data.length > 0) {
          toast.success("Class updated successfully");
          setDialogOpen(false);
          setEditingClass(null);
          setFormData({
            name: "",
            subject: "",
            section: "",
            description: "",
            teacher_id: "",
          });
          loadData();
        }
      } else {
        const { data, error } = await supabase
          .from("classes")
          .insert([classData])
          .select();

        if (error) {
          console.error("Create error details:", error);
          toast.error(`Create failed: ${error.message}`);
          setSaving(false);
          return;
        }
        
        if (data && data.length > 0) {
          toast.success("Class created successfully");
          setDialogOpen(false);
          setEditingClass(null);
          setFormData({
            name: "",
            subject: "",
            section: "",
            description: "",
            teacher_id: "",
          });
          loadData();
        }
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Save failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      subject: cls.subject || "",
      section: cls.section || "",
      description: cls.description || "",
      teacher_id: cls.teacher_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw new Error(`Delete error: ${error.message}`);
      toast.success("Class deleted successfully");
      loadData();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Delete failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      subject: "",
      section: "",
      description: "",
      teacher_id: "",
    });
    setDialogOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Classes Management</CardTitle>
            <CardDescription>Manage classes and assign teachers</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((cls) => {
              const teacher = teachers.find(t => t.user_id === cls.teacher_id);
              return (
                <TableRow key={cls.id}>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.subject || "N/A"}</TableCell>
                  <TableCell>{cls.section || "N/A"}</TableCell>
                  <TableCell>{teacher?.full_name || "Unassigned"}</TableCell>
                  <TableCell>
                    {cls.created_at ? new Date(cls.created_at).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cls)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cls.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                {editingClass ? "Edit the class details" : "Create a new class"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grade 10 Mathematics"
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
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the class"
                />
              </div>
              <div>
                <Label>Assign Teacher</Label>
                <Select 
                  value={formData.teacher_id || undefined} 
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No teacher assigned</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.user_id || ""}>
                        {teacher.full_name || "Unknown Teacher"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setEditingClass(null);
                  setFormData({
                    name: "",
                    subject: "",
                    section: "",
                    description: "",
                    teacher_id: "",
                  });
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingClass ? "Update Class" : "Create Class"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}