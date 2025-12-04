import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SchemaDiagnostic() {
  const [schemaInfo, setSchemaInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Check profiles table structure
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      // Check if updated_at column exists
      let hasUpdatedAt = false;
      let updatedAtCheckError = null;
      
      try {
        const { data: updatedAtData, error: updatedAtError } = await supabase
          .from('profiles')
          .select('updated_at')
          .limit(1)
          .maybeSingle();
          
        if (!updatedAtError) {
          hasUpdatedAt = true;
        } else {
          updatedAtCheckError = updatedAtError.message;
        }
      } catch (err) {
        updatedAtCheckError = err instanceof Error ? err.message : 'Unknown error';
      }

      // Check user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);

      // Test profile creation directly
      let profileCreationTest = null;
      let profileCreationError = null;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to upsert a test profile
          const { data: testData, error: testError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: "Test User",
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select()
            .maybeSingle();
            
          profileCreationTest = testData;
          profileCreationError = testError;
        }
      } catch (err) {
        profileCreationError = err instanceof Error ? err.message : 'Unknown error';
      }

      setSchemaInfo({
        profiles: {
          success: !profilesError,
          error: profilesError?.message || null,
          data: profilesData,
          hasUpdatedAtColumn: hasUpdatedAt,
          updatedAtError: updatedAtCheckError
        },
        user_roles: {
          success: !rolesError,
          error: rolesError?.message || null,
          data: rolesData
        },
        profileCreationTest: {
          success: !profileCreationError,
          error: profileCreationError?.message || profileCreationError,
          data: profileCreationTest
        }
      });
    } catch (error: any) {
      console.error("Diagnostics error:", error);
      toast.error("Error running diagnostics: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testProfileCreation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in");
        return;
      }

      // Try to upsert a test profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: "Test User",
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .maybeSingle();

      if (error) {
        toast.error("Profile creation failed: " + error.message);
        console.error("Profile creation error details:", error);
      } else {
        toast.success("Profile creation successful");
        console.log("Profile creation result:", data);
      }

      // Refresh diagnostics
      runDiagnostics();
    } catch (error: any) {
      toast.error("Error testing profile creation: " + error.message);
      console.error("Error details:", error);
    }
  };

  if (loading) {
    return <div>Loading schema diagnostics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schema Diagnostic</CardTitle>
        <CardDescription>Check database schema and table structures</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(schemaInfo).map(([key, value]: [string, any]) => (
            <div key={key} className="border p-3 rounded">
              <h3 className="font-semibold capitalize">{key.replace(/_/g, ' ')}</h3>
              <p className={value.success ? "text-green-600" : "text-red-600"}>
                Status: {value.success ? "Success" : "Error"}
              </p>
              {value.error && (
                <p className="text-red-500 text-sm">Error: {value.error}</p>
              )}
              {value.hasUpdatedAtColumn !== undefined && (
                <p className={value.hasUpdatedAtColumn ? "text-green-600" : "text-red-600"}>
                  Has updated_at column: {value.hasUpdatedAtColumn ? "Yes" : "No"}
                </p>
              )}
              {value.updatedAtError && (
                <p className="text-red-500 text-sm">updated_at check error: {value.updatedAtError}</p>
              )}
              {value.data && (
                <p className="text-sm">Sample data: {JSON.stringify(value.data, null, 2)}</p>
              )}
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button onClick={runDiagnostics}>Refresh Diagnostics</Button>
            <Button onClick={testProfileCreation} variant="secondary">Test Profile Creation</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}