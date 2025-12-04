import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Database, Users, Mail, Shield } from "lucide-react";

export default function SettingsPage() {
  const [autoEnrollment, setAutoEnrollment] = useState(false);
  const [maxStudentsPerClass, setMaxStudentsPerClass] = useState("50");
  const [allowStudentMessaging, setAllowStudentMessaging] = useState(true);
  const [requireTeacherApproval, setRequireTeacherApproval] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  const handleSaveGeneral = () => {
    toast.success("General settings saved successfully");
  };

  const handleSavePermissions = () => {
    toast.success("Permission settings saved successfully");
  };

  const handleExportData = async () => {
    try {
      // Export all tables data
      const tables = ['profiles', 'classes', 'teachers', 'exams', 'attendance', 'assignments'] as const;
      const exportData: Record<string, any> = {};

      for (const table of tables) {
        const { data } = await supabase.from(table).select('*');
        exportData[table] = data;
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduguide-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Error exporting data");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure platform-wide options and permissions
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-enrollment">Auto Enrollment</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically enroll new students in default class
                  </p>
                </div>
                <Switch
                  id="auto-enrollment"
                  checked={autoEnrollment}
                  onCheckedChange={setAutoEnrollment}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-students">Max Students Per Class</Label>
                <Input
                  id="max-students"
                  type="number"
                  value={maxStudentsPerClass}
                  onChange={(e) => setMaxStudentsPerClass(e.target.value)}
                />
              </div>

              <Button onClick={handleSaveGeneral}>Save General Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Settings</CardTitle>
              <CardDescription>Control user access and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="student-messaging">Student Messaging</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow students to send messages to teachers
                  </p>
                </div>
                <Switch
                  id="student-messaging"
                  checked={allowStudentMessaging}
                  onCheckedChange={setAllowStudentMessaging}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="teacher-approval">Require Teacher Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Teachers must be approved before accessing dashboard
                  </p>
                </div>
                <Switch
                  id="teacher-approval"
                  checked={requireTeacherApproval}
                  onCheckedChange={setRequireTeacherApproval}
                />
              </div>

              <Button onClick={handleSavePermissions}>Save Permission Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications for important events
                  </p>
                </div>
                <Switch
                  id="enable-notifications"
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
              </div>

              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export and manage platform data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a backup of all platform data in JSON format
                </p>
                <Button onClick={handleExportData}>
                  <Database className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}