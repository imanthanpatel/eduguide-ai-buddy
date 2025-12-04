import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DataFetchDiagnostic() {
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

      // Test user_roles access
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .limit(5);

      // Test inserting a test role (with current user)
      let insertTestResult = null;
      let insertTestError = null;
      
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          // Check if user already has roles
          const { data: existingRoles } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', userData.user.id)
            .limit(1);
            
          if (!existingRoles || existingRoles.length === 0) {
            // Only test insert if user has no roles
            const { data: insertData, error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: userData.user.id,
                role: 'student'
              })
              .select()
              .maybeSingle();
              
            insertTestResult = insertData;
            insertTestError = insertError;
            
            // Clean up test data if successful
            if (insertData && insertData.id) {
              await supabase
                .from('user_roles')
                .delete()
                .eq('id', insertData.id);
            }
          } else {
            insertTestResult = "Skipped (user already has roles)";
          }
        } else {
          insertTestResult = "Skipped (not logged in)";
        }
      } catch (insertErr) {
        insertTestError = insertErr;
      }

      setDiagnosticInfo({
        profiles: {
          success: !profileError,
          error: profileError?.message || null,
          data: profileData
        },
        user_roles: {
          success: !rolesError,
          error: rolesError?.message || null,
          data: rolesData
        },
        insertTest: {
          success: !insertTestError,
          error: insertTestError?.message || null,
          data: insertTestResult
        }
      });
    } catch (error: any) {
      console.error("Diagnostics error:", error);
      toast.error("Error running diagnostics: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading diagnostics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Diagnostic</CardTitle>
        <CardDescription>Check for database connectivity and policy issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(diagnosticInfo).map(([key, value]: [string, any]) => (
            <div key={key} className="border p-3 rounded">
              <h3 className="font-semibold capitalize">{key.replace(/_/g, ' ')}</h3>
              <p className={value.success ? "text-green-600" : "text-red-600"}>
                Status: {value.success ? "Success" : "Error"}
              </p>
              {value.error && (
                <p className="text-red-500 text-sm">Error: {value.error}</p>
              )}
              {value.data && (
                <p className="text-sm">Data: {JSON.stringify(value.data, null, 2)}</p>
              )}
            </div>
          ))}
          
          <Button onClick={runDiagnostics}>Refresh Diagnostics</Button>
        </div>
      </CardContent>
    </Card>
  );
}