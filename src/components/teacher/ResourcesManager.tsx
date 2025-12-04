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
import { Pencil, Trash2, Plus, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_url: string;
  resource_type: string | null;
  class_id: string | null;
  subject: string | null;
  created_at: string | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
}

export default function ResourcesManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resource_url: "",
    resource_type: "pdf",
    class_id: "",
    subject: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [resourcesRes, classesRes] = await Promise.all([
        supabase.from("resources").select("*").eq("uploaded_by", user?.id).order("created_at", { ascending: false }),
        supabase.from("classes").select("*").eq("teacher_id", user?.id)
      ]);

      if (resourcesRes.error) throw resourcesRes.error;
      if (classesRes.error) throw classesRes.error;

      setResources(resourcesRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error: any) {
      toast.error("Error loading data");
      console.error(error);
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
      if (!formData.title || formData.title.trim() === "") {
        toast.error("Title is required");
        setSaving(false);
        return;
      }

      if (!formData.resource_url || formData.resource_url.trim() === "") {
        toast.error("Resource URL is required");
        setSaving(false);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("You must be logged in to add resources");
        setSaving(false);
        return;
      }

      // Prepare data - convert empty strings to null
      const resourceData: any = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        resource_url: formData.resource_url.trim(),
        resource_type: formData.resource_type || "pdf",
        uploaded_by: user.id,
        subject: formData.subject?.trim() || null,
        class_id: formData.class_id && 
                  formData.class_id.trim() !== "" && 
                  formData.class_id !== "none" 
                  ? formData.class_id.trim() 
                  : null,
      };
      
      if (editingResource) {
        const { data, error } = await supabase
          .from("resources")
          .update(resourceData)
          .eq("id", editingResource.id)
          .select();

        if (error) {
          console.error("Update error details:", error);
          console.error("Error code:", error.code);
          console.error("Error details:", error.details);
          console.error("Error hint:", error.hint);
          toast.error(`Update failed: ${error.message || 'Unknown error'}`);
          setSaving(false);
          return;
        }
        
        if (data && data.length > 0) {
          toast.success("Resource updated successfully");
          setDialogOpen(false);
          setEditingResource(null);
          setFormData({
            title: "",
            description: "",
            resource_url: "",
            resource_type: "pdf",
            class_id: "",
            subject: "",
          });
          loadData();
        }
      } else {
        const { data, error } = await supabase
          .from("resources")
          .insert([resourceData])
          .select();

        if (error) {
          console.error("Insert error details:", error);
          console.error("Error code:", error.code);
          console.error("Error details:", error.details);
          console.error("Error hint:", error.hint);
          console.error("Resource data being inserted:", resourceData);
          toast.error(`Add failed: ${error.message || 'Unknown error'}`);
          setSaving(false);
          return;
        }
        
        if (data && data.length > 0) {
          toast.success("Resource added successfully");
          setDialogOpen(false);
          setEditingResource(null);
          setFormData({
            title: "",
            description: "",
            resource_url: "",
            resource_type: "pdf",
            class_id: "",
            subject: "",
          });
          loadData();
        }
      }

    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Error saving resource");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      resource_url: resource.resource_url,
      resource_type: resource.resource_type || "pdf",
      class_id: resource.class_id || "",
      subject: resource.subject || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Resource deleted successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNew = () => {
    setEditingResource(null);
    setFormData({
      title: "",
      description: "",
      resource_url: "",
      resource_type: "pdf",
      class_id: "",
      subject: "",
    });
    setDialogOpen(true);
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return "All Classes";
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name} (${cls.section})` : "Unknown";
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Resources Manager</CardTitle>
            <CardDescription>Upload and manage learning materials</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell>{resource.title}</TableCell>
                <TableCell className="capitalize">{resource.resource_type || "N/A"}</TableCell>
                <TableCell>{resource.subject || "N/A"}</TableCell>
                <TableCell>{getClassName(resource.class_id)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(resource.resource_url, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(resource.id)}>
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
              <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
              <DialogDescription>
                Upload learning materials for your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Resource title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={formData.resource_url}
                  onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.resource_type} onValueChange={(value) => setFormData({ ...formData, resource_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label>Class (Optional)</Label>
                <Select 
                  value={formData.class_id || undefined} 
                  onValueChange={(value) => setFormData({ ...formData, class_id: value || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.section})
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
                  setEditingResource(null);
                  setFormData({
                    title: "",
                    description: "",
                    resource_url: "",
                    resource_type: "pdf",
                    class_id: "",
                    subject: "",
                  });
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingResource ? "Update Resource" : "Add Resource"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
