import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PolicyDiagnostic() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Test basic connectivity
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      // Test classes access
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .limit(1);

      // Test enrollments access
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select('id')
        .limit(1);

      // Test teachers access
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('id')
        .limit(1);

      setDiagnosticInfo({
        profiles: {
          success: !profileError,
          error: profileError?.message || null,
          data: profileData
        },
        classes: {
          success: !classesError,
          error: classesError?.message || null,
          data: classesData
        },
        enrollments: {
          success: !enrollmentsError,
          error: enrollmentsError?.message || null,
          data: enrollmentsData
        },
        teachers: {
          success: !teachersError,
          error: teachersError?.message || null,
          data: teachersData
        }
      });
    } catch (error: any) {
      console.error("Diagnostics error:", error);
      toast.error("Error running diagnostics: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPolicies = async () => {
    try {
      // Try to call the reset function if it exists
      const { data, error } = await supabase.rpc('reset_classes_policies' as any);
      
      if (error) {
        console.error("Error calling reset function:", error);
        toast.error("Error resetting policies: " + error.message);
      } else {
        toast.success("Policies reset function called successfully");
        // Refresh diagnostics
        runDiagnostics();
      }
    } catch (error: any) {
      console.error("Error calling reset function:", error);
      toast.error("Error calling reset function: " + error.message);
    }
  };

  if (loading) {
    return <div>Running diagnostics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Diagnostic</CardTitle>
        <CardDescription>Check for database policy issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(diagnosticInfo).map(([key, value]: [string, any]) => (
            <div key={key} className="border p-3 rounded">
              <h3 className="font-semibold capitalize">{key}</h3>
              <p className={value.success ? "text-green-600" : "text-red-600"}>
                Status: {value.success ? "Success" : "Error"}
              </p>
              {value.error && (
                <p className="text-red-500 text-sm">Error: {value.error}</p>
              )}
              {value.data && (
                <p className="text-sm">Data: {JSON.stringify(value.data)}</p>
              )}
            </div>
          ))}
          
          <Button onClick={runDiagnostics}>Refresh Diagnostics</Button>
          <Button onClick={resetPolicies} variant="destructive">Reset Policies</Button>
        </div>
      </CardContent>
    </Card>
  );
}