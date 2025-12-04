import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Users, TrendingUp, TrendingDown, Brain, Clock, AlertTriangle, Target } from "lucide-react";
import { toast } from "sonner";

interface StudentAnalytics {
  id: string;
  student_id: string;
  subject: string;
  chapter: string;
  performance_score: number;
  learning_speed: string;
  weak_areas: string[];
  last_activity: string;
  student_name?: string;
}

const StudentAnalyticsView = () => {
  const [analyticsData, setAnalyticsData] = useState<StudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get teacher's classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      if (!classesData || classesData.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = classesData.map(c => c.id);

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("student_id")
        .in("class_id", classIds);

      if (!enrollments) {
        setLoading(false);
        return;
      }

      const studentIds = enrollments.map(e => e.student_id);

      // Get student profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      // Get analytics for these students
      const { data: analytics } = await supabase
        .from("student_analytics")
        .select("*")
        .in("student_id", studentIds)
        .order("last_activity", { ascending: false });

      if (analytics) {
        // Merge student names
        const enrichedAnalytics = analytics.map(a => {
          const profile = profiles?.find(p => p.id === a.student_id);
          return {
            ...a,
            student_name: profile?.full_name || "Unknown Student"
          };
        });
        setAnalyticsData(enrichedAnalytics);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getUniqueStudents = () => {
    const studentsMap = new Map();
    analyticsData.forEach(a => {
      if (!studentsMap.has(a.student_id)) {
        studentsMap.set(a.student_id, {
          id: a.student_id,
          name: a.student_name,
          avgPerformance: 0,
          recordCount: 0
        });
      }
      const student = studentsMap.get(a.student_id);
      student.avgPerformance += a.performance_score || 0;
      student.recordCount += 1;
    });

    return Array.from(studentsMap.values()).map(s => ({
      ...s,
      avgPerformance: s.recordCount > 0 ? s.avgPerformance / s.recordCount : 0
    }));
  };

  const getStudentData = (studentId: string) => {
    return analyticsData.filter(a => a.student_id === studentId);
  };

  const getPerformanceTrend = (studentId: string) => {
    const data = getStudentData(studentId);
    return data.map((d, idx) => ({
      index: idx + 1,
      score: d.performance_score || 0,
      subject: d.subject || "General"
    }));
  };

  const getSubjectPerformance = (studentId: string) => {
    const data = getStudentData(studentId);
    const subjectMap = new Map();
    
    data.forEach(d => {
      const subject = d.subject || "General";
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { subject, score: 0, count: 0 });
      }
      const subj = subjectMap.get(subject);
      subj.score += d.performance_score || 0;
      subj.count += 1;
    });

    return Array.from(subjectMap.values()).map(s => ({
      subject: s.subject,
      score: s.count > 0 ? Math.round(s.score / s.count) : 0
    }));
  };

  const getAllWeakAreas = (studentId: string) => {
    const data = getStudentData(studentId);
    const weakAreasSet = new Set<string>();
    data.forEach(d => {
      if (d.weak_areas) {
        d.weak_areas.forEach(area => weakAreasSet.add(area));
      }
    });
    return Array.from(weakAreasSet);
  };

  const getLearningSpeedDistribution = () => {
    const speeds = { fast: 0, medium: 0, slow: 0 };
    analyticsData.forEach(a => {
      const speed = (a.learning_speed || "medium").toLowerCase();
      if (speed in speeds) {
        speeds[speed as keyof typeof speeds]++;
      }
    });
    return [
      { speed: "Fast", count: speeds.fast },
      { speed: "Medium", count: speeds.medium },
      { speed: "Slow", count: speeds.slow }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading analytics...</p>
      </div>
    );
  }

  const students = getUniqueStudents();

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>
            No student analytics available yet. Students need to complete activities to generate analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(students.reduce((sum, s) => sum + s.avgPerformance, 0) / students.length)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {students.filter(s => s.avgPerformance < 50).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Speed Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Speed Distribution</CardTitle>
          <CardDescription>Overview of student learning speeds</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getLearningSpeedDistribution()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="speed" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Student Analytics</CardTitle>
          <CardDescription>Click on a student to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => {
              const studentData = getStudentData(student.id);
              const latestRecord = studentData[0];
              const weakAreas = getAllWeakAreas(student.id);
              
              return (
                <Card
                  key={student.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedStudent(student.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Last activity: {latestRecord ? new Date(latestRecord.last_activity).toLocaleDateString() : "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Avg Performance</span>
                        <span className="font-semibold">{Math.round(student.avgPerformance)}%</span>
                      </div>
                      <Progress value={student.avgPerformance} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4" />
                      <span>Speed: </span>
                      <Badge variant={latestRecord?.learning_speed === "fast" ? "default" : "secondary"}>
                        {latestRecord?.learning_speed || "Medium"}
                      </Badge>
                    </div>

                    {weakAreas.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Weak Areas:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {weakAreas.slice(0, 3).map((area, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {weakAreas.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{weakAreas.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Student View */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detailed Analytics: {students.find(s => s.id === selectedStudent)?.name}
            </CardTitle>
            <CardDescription>
              Comprehensive performance analysis and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="performance">
              <TabsList>
                <TabsTrigger value="performance">Performance Trend</TabsTrigger>
                <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
                <TabsTrigger value="weakareas">Weak Areas</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getPerformanceTrend(selectedStudent)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: "Activity", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Score (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-4">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={getSubjectPerformance(selectedStudent)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Performance" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="weakareas" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAllWeakAreas(selectedStudent).map((area, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-500" />
                          {area}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Requires additional practice and support
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {getAllWeakAreas(selectedStudent).length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      No weak areas identified - Great performance!
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAnalyticsView;
