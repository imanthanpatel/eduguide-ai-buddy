import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  student_id: string;
  profiles: {
    full_name: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  date: string;
}

export default function AttendanceManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadAttendance();
    }
  }, [selectedClass, date]);

  const loadClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .eq("teacher_id", user?.id);

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Error loading classes");
    }
  };

  const loadStudents = async () => {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from("class_enrollments")
        .select("id, student_id")
        .eq("class_id", selectedClass);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = enrollments.map(e => e.student_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      if (profileError) throw profileError;

      const studentsWithProfiles = enrollments.map(enrollment => ({
        id: enrollment.id,
        student_id: enrollment.student_id,
        profiles: profiles?.find(p => p.id === enrollment.student_id) || { full_name: null }
      }));

      setStudents(studentsWithProfiles);
    } catch (error: any) {
      toast.error("Error loading students");
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", format(date, "yyyy-MM-dd"));

      if (error) throw error;
      setExistingRecords(data || []);
      
      const attendanceMap: Record<string, string> = {};
      data?.forEach((record) => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error: any) {
      toast.error("Error loading attendance");
    }
  };

  const handleMarkAttendance = async (studentId: string, status: string) => {
    const newAttendance = { ...attendance, [studentId]: status };
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const attendanceDate = format(date, "yyyy-MM-dd");

      // Delete existing records for this date
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("date", attendanceDate);

      // Insert new records
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        date: attendanceDate,
        status,
        marked_by: user?.id,
      }));

      const { error } = await supabase
        .from("attendance")
        .insert(records);

      if (error) throw error;
      toast.success("Attendance saved successfully");
      loadAttendance();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Manager</CardTitle>
        <CardDescription>Mark and track student attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
            </PopoverContent>
          </Popover>
        </div>

        {selectedClass && students.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.profiles?.full_name || "Unknown"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        attendance[student.student_id] === 'present' ? 'bg-green-100 text-green-800' :
                        attendance[student.student_id] === 'absent' ? 'bg-red-100 text-red-800' :
                        attendance[student.student_id] === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {attendance[student.student_id] || 'Not marked'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendance[student.student_id] === 'present' ? 'default' : 'outline'}
                          onClick={() => handleMarkAttendance(student.student_id, 'present')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.student_id] === 'absent' ? 'default' : 'outline'}
                          onClick={() => handleMarkAttendance(student.student_id, 'absent')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.student_id] === 'late' ? 'default' : 'outline'}
                          onClick={() => handleMarkAttendance(student.student_id, 'late')}
                        >
                          L
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Attendance"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
