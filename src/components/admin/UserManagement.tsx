import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  email_confirmed_at: string | null;
  created_at: string;
  role?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Simpler approach - get users directly from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get profile information
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) {
        console.warn("Error fetching profiles:", profilesError);
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.warn("Error fetching user roles:", rolesError);
      }

      // Combine auth users with profile data and roles
      const combinedUsers = authUsers?.users?.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        const role = userRoles?.find(r => r.user_id === authUser.id)?.role;
        return {
          id: authUser.id,
          email: authUser.email || "",
          full_name: profile?.full_name || "No name",
          email_confirmed_at: authUser.email_confirmed_at,
          created_at: authUser.created_at,
          role: role || "No role assigned"
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Error loading users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmUserEmail = async (userId: string) => {
    try {
      // Note: In a real application, you would use Supabase Admin API for this
      // For now, we'll show a message about how to do this in the Supabase dashboard
      toast.info("In a production environment, this would confirm the user's email automatically. For now, please use the Supabase dashboard to manually confirm users.");
      
      // Refresh the user list
      loadUsers();
    } catch (error: any) {
      console.error("Error confirming user:", error);
      toast.error("Error confirming user: " + error.message);
    }
  };

  const assignRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      loadUsers(); // Refresh the user list
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast.error("Error assigning role: " + error.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(emailFilter.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(emailFilter.toLowerCase()))
  );

  if (loading) return <div>Loading users...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts (Email confirmation is currently disabled)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="emailFilter">Filter users</Label>
          <Input
            id="emailFilter"
            placeholder="Search by email or name..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.email_confirmed_at ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-yellow-600">Active (Confirmation Disabled)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={user.role} 
                      onValueChange={(value) => assignRole(user.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" disabled>
                      Email Confirmation Disabled
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-800">Email Confirmation Disabled</h3>
          <p className="text-blue-700 mt-2">
            Email confirmation has been disabled for this application. All users can sign in immediately after registration.
          </p>
          <p className="text-blue-700 mt-2">
            To re-enable email confirmation:
          </p>
          <ol className="text-blue-700 mt-2 list-decimal list-inside">
            <li>Remove the migration that disables email confirmation</li>
            <li>Set "Enable email confirmations" to ON in the Supabase Dashboard</li>
            <li>Re-enable the email confirmation checks in the Auth component</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}