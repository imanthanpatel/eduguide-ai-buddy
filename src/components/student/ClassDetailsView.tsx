import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, BookOpen, ExternalLink, Calendar, Award } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string | null;
  resource_url: string;
  uploaded_by: string | null;
  class_id: string | null;
  subject: string | null;
  created_at: string | null;
}

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

interface ClassDetailsViewProps {
  classId: string;
  className: string;
  onBack: () => void;
}

export default function ClassDetailsView({ classId, className, onBack }: ClassDetailsViewProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      const [resourcesRes, assignmentsRes] = await Promise.all([
        supabase
          .from("resources")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: false }),
        supabase
          .from("assignments")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: false })
      ]);

      if (resourcesRes.error) {
        console.error("Error loading resources:", resourcesRes.error);
        toast.error("Error loading resources");
      } else {
        setResources(resourcesRes.data || []);
      }

      if (assignmentsRes.error) {
        console.error("Error loading assignments:", assignmentsRes.error);
        toast.error("Error loading assignments");
      } else {
        setAssignments(assignmentsRes.data || []);
      }
    } catch (error: any) {
      console.error("Error loading class data:", error);
      toast.error("Error loading class data");
    } finally {
      setLoading(false);
    }
  };

  const getResourceTypeIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading class details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Classes
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {className}
          </CardTitle>
          <CardDescription>Resources and Assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resources" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resources">
                <FileText className="h-4 w-4 mr-2" />
                Resources ({resources.length})
              </TabsTrigger>
              <TabsTrigger value="assignments">
                <Award className="h-4 w-4 mr-2" />
                Assignments ({assignments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="space-y-4 mt-4">
              {resources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No resources available yet.</p>
                  <p className="text-sm mt-1">Your teacher will upload resources here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((resource) => (
                    <Card key={resource.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getResourceTypeIcon(resource.resource_type)}
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                          </div>
                          {resource.resource_type && (
                            <Badge variant="secondary">{resource.resource_type.toUpperCase()}</Badge>
                          )}
                        </div>
                        {resource.subject && (
                          <CardDescription>{resource.subject}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {resource.created_at && formatDate(resource.created_at)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(resource.resource_url, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 mt-4">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No assignments available yet.</p>
                  <p className="text-sm mt-1">Your teacher will post assignments here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          {assignment.total_marks && (
                            <Badge variant="secondary">
                              {assignment.total_marks} marks
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {assignment.due_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {formatDate(assignment.due_date)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Posted: {assignment.created_at && formatDate(assignment.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

