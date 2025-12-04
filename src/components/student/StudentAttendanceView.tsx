import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Calendar, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  class_id: string | null;
  classes: {
    name: string;
    section: string | null;
    subject: string | null;
  } | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
}

export default function StudentAttendanceView() {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments, error: enrollError } = await supabase
        .from("class_enrollments")
        .select("class_id, classes(id, name, section, subject)")
        .eq("student_id", user.id);

      if (enrollError) throw enrollError;

      const classList = (enrollments || []).map((e: any) => ({
        id: e.class_id,
        name: e.classes.name,
        section: e.classes.section,
        subject: e.classes.subject,
      }));

      setClasses(classList);
    } catch (error: any) {
      toast.error("Error loading classes");
      console.error(error);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          class_id,
          classes(id, name, section, subject)
        `)
        .eq("student_id", user.id)
        .order("date", { ascending: false });

      if (selectedClass !== "all") {
        query = query.eq("class_id", selectedClass);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendanceRecords(data || []);

      // Calculate statistics
      const total = data?.length || 0;
      const present = data?.filter((r) => r.status === "present").length || 0;
      const absent = data?.filter((r) => r.status === "absent").length || 0;
      const late = data?.filter((r) => r.status === "late").length || 0;
      const excused = data?.filter((r) => r.status === "excused").length || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({
        total,
        present,
        absent,
        late,
        excused,
        percentage,
      });
    } catch (error: any) {
      toast.error("Error loading attendance");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "late":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "excused":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case "excused":
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-3 sm:mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                My Attendance
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">View your attendance records across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 sm:mb-6">
                <label className="text-sm font-medium mb-2 block">Filter by Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section && `(${cls.section})`} {cls.subject && `- ${cls.subject}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Total Days</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.present}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Present</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.absent}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Absent</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.late}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Late</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.excused}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Excused</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-primary">{stats.percentage}%</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Attendance</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Records */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No attendance records found.</p>
                  <p className="text-sm mt-1">Your teacher will mark attendance for your classes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceRecords.map((record) => (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {getStatusIcon(record.status)}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm sm:text-base truncate">
                                {new Date(record.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                              {record.classes && (
                                <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                                  {record.classes.name} {record.classes.section && `(${record.classes.section})`}
                                  {record.classes.subject && ` - ${record.classes.subject}`}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(record.status)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

