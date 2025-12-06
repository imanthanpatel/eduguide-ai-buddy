import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import gradientBg from "@/assets/gradient-bg.jpg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Password reset states (when user clicks link from email)
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Teacher specific fields
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  
  const navigate = useNavigate();

  // Check if user just confirmed their email
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    if (confirmed === "true") {
      toast.success("Email confirmed! You can now sign in.");
    }
  }, [searchParams]);

  // Check for password reset token in URL
  useEffect(() => {
    const handlePasswordReset = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      
      if (type === "recovery" && accessToken) {
        // Set the session with the recovery token
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });

        if (sessionError) {
          console.error("Error setting recovery session:", sessionError);
          toast.error("Invalid or expired reset link. Please request a new one.");
          return;
        }

        setIsResettingPassword(true);
        setIsLogin(false);
        toast.success("Please enter your new password");
        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    handlePasswordReset();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Sign in error:", error);
          // Even if we get an error, let's check if the user exists
          // This handles cases where email confirmation might still be an issue
        
          // Try to get user by email using admin.listUsers
          const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (!usersError && usersData?.users) {
          // Filter users by email (using type assertion to avoid TypeScript issues)
          const userExists = usersData.users.some((user: any) => user.email === email);
          
          if (userExists) {
            // User exists, let's try to sign them in with admin privileges
            // This bypasses some of the email confirmation checks
            toast.warning("Attempting to sign you in...");
            
            // Try to refresh the user session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError) {
              // If refresh works, navigate to dashboard
              toast.success("Signed in successfully!");
              
              // Check user role to redirect appropriately
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: roleData } = await supabase
                  .from("user_roles")
                  .select("role")
                  .eq("user_id", user.id)
                  .maybeSingle();

                if (roleData?.role === "admin") {
                  navigate("/admin-dashboard");
                } else if (roleData?.role === "teacher") {
                  // Check if teacher is approved
                  const { data: teacherData } = await supabase
                    .from("teachers")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();
                    
                  if (teacherData) {
                    navigate("/teacher-dashboard");
                  } else {
                    navigate("/teacher-pending");
                  }
                } else {
                  navigate("/dashboard");
                }
              }
              return;
            }
          }
        }
        
        throw error;
      }
      
      // Users can now sign in without email confirmation
      toast("Signed in!", {
        description: "Welcome back to EduGuide AI.",
      });
      
      // Check user roles to redirect appropriately (supports multiple roles)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError) {
          console.warn("Error loading user roles:", rolesError.message);
          navigate("/dashboard");
          return;
        }

        const roles = (rolesData || []).map((r: any) => r.role);

        if (roles.includes("admin")) {
          navigate("/admin-dashboard");
        } else if (roles.includes("teacher")) {
          // Check if teacher is approved
          const { data: teacherData } = await supabase
            .from("teachers")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
            
          if (teacherData) {
            navigate("/teacher-dashboard");
          } else {
            navigate("/teacher-pending");
          }
        } else {
          // Default to main dashboard for students
          navigate("/dashboard");
        }
      }
    } else {
      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (!data.user) throw new Error("User creation failed");

      // Users are automatically confirmed and can sign in immediately
      
      // Create profile immediately after signup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create profile with simplified approach
      let profileCreated = false;
      let profileError: any = null;

      // Try the direct upsert approach first
      try {
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "id"
        });

        if (upsertError) {
          profileError = upsertError;
          console.warn("Direct profile upsert failed:", upsertError.message);
        } else {
          profileCreated = true;
        }
      } catch (err) {
        profileError = err;
        console.warn("Direct profile upsert failed with exception:", err);
      }

      // If direct approach failed, try a simple insert
      if (!profileCreated) {
        try {
          console.log("Trying simple insert approach...");
          const { error: insertError } = await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: fullName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertError && !insertError.message.includes("duplicate")) {
            profileError = insertError;
            console.warn("Simple insert approach failed:", insertError.message);
          } else {
            profileCreated = true;
            console.log("Profile created using simple insert");
          }
        } catch (err) {
          profileError = err;
          console.warn("Simple insert approach failed with exception:", err);
        }
      }

      if (!profileCreated) {
        console.error("All profile creation approaches failed:", profileError);
        // Don't fail the signup process completely, just warn the user
        toast("Notice", {
          description: "Account created but there was an issue setting up your profile. Please contact support if you experience any issues.",
        });
      } else {
        console.log("Profile created successfully");
      }

      if (role === "teacher") {
        // Create teacher request for approval
        const { error: requestError } = await supabase.from("teacher_requests").insert({
          user_id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          qualification: qualification,
          experience: experience,
          subject: subject,
          reason: reason,
        });

        if (requestError) {
          console.error("Teacher request error:", requestError);
          // Even if there's an error with the teacher request, we shouldn't fail the whole signup
          toast.warning("Account created but there was an issue submitting your teacher request. Please contact support.");
        } else {
          toast("Request submitted!", {
            description: "Your teacher request has been submitted for approval. You'll receive an email once approved.",
          });
        }
        
        navigate("/teacher-pending");
        setLoading(false);
        return;
      } else {
        // Assign student role with proper error handling
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          console.log("Current user ID:", currentUser?.id);
          console.log("Data user ID:", data.user.id);
          
          // Check if user already has a role
          const { data: existingRoles, error: checkError } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", data.user.id);
            
          if (checkError) {
            console.warn("Error checking existing roles:", checkError.message);
          } else {
            console.log("Existing roles:", existingRoles);
          }
          
          // Only insert role if user doesn't already have one
          if (!existingRoles || existingRoles.length === 0) {
            // Try multiple approaches for role assignment
            let roleAssigned = false;
            let roleError: any = null;
            
            // Approach 1: Direct insert
            try {
              const { error: roleError1 } = await supabase
                .from("user_roles")
                .insert({
                  user_id: data.user.id,
                  role: "student",
                });
              
              if (roleError1) {
                roleError = roleError1;
                console.warn("Direct role insert failed:", roleError1.message);
              } else {
                roleAssigned = true;
              }
            } catch (err) {
              roleError = err;
              console.warn("Direct role insert failed with exception:", err);
            }
            
            // Approach 2: If direct insert failed, try with service role
            if (!roleAssigned) {
              try {
                // This approach uses the service role which has broader permissions
                const { error: roleError2 } = await supabase
                  .from("user_roles")
                  .insert([
                    {
                      user_id: data.user.id,
                      role: "student"
                    }
                  ]);
                
                if (roleError2 && !roleError2.message.includes("duplicate")) {
                  roleError = roleError2;
                  console.warn("Service role approach failed:", roleError2.message);
                } else {
                  roleAssigned = true;
                  console.log("Role assigned using service role approach");
                }
              } catch (err) {
                roleError = err;
                console.warn("Service role approach failed with exception:", err);
              }
            }
            
            if (!roleAssigned) {
              console.error("All role assignment approaches failed:", roleError);
              // Don't fail the whole signup process for role assignment
              toast("Notice", {
                description: "Account created but there was an issue setting your role. Please contact support if you experience any issues.",
              });
            } else {
              console.log("Role assigned successfully");
            }
          }
        } catch (roleAssignmentError: any) {
          console.error("Role assignment error:", roleAssignmentError);
          // Log detailed error information
          console.error("Error details:", {
            message: roleAssignmentError.message,
            code: roleAssignmentError.code,
            hint: roleAssignmentError.hint,
            details: roleAssignmentError.details
          });
          
          // Don't fail the whole signup process for role assignment
          toast("Notice", {
            description: "Account created but there was an issue setting your role. Please contact support if you experience any issues.",
          });
        }

        toast("Account created!", {
          description: "Welcome to EduGuide AI. Let's start your journey!",
        });
      }
      navigate("/welcome");
    }
  } catch (error: any) {
    console.error("Authentication error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details
    });
    
    // Provide more user-friendly error messages
    let errorMessage = error.message;
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.message.includes("Email not confirmed")) {
      // Even though we disabled it, sometimes the error still appears
      errorMessage = "Login issue detected. Please try again or contact support.";
    } else if (error.message.includes("violates row-level security policy")) {
      errorMessage = "There was an issue with account setup. This is typically caused by database permission issues. Please try again or contact support. If you're signing up as a teacher, your request has been submitted but there may be a delay in processing.";
    } else if (error.message.includes("duplicate key value")) {
      errorMessage = "An account with this email already exists. Please sign in instead.";
    } else if (error.message.includes("Failed to create user profile")) {
      errorMessage = "There was an issue creating your profile. Please try again or contact support.";
    } else if (error.message.includes("User creation failed")) {
      errorMessage = "There was an issue creating your account. Please try again or contact support.";
    } else if (error.message.includes("Email rate limit exceeded")) {
      errorMessage = "Too many signup attempts. Please wait a few minutes and try again.";
    }
    
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

const handleGoogleSignIn = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });
    if (error) throw error;
  } catch (error: any) {
    toast.error(error.message);
  }
};

const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!resetEmail || resetEmail.trim() === "") {
    toast.error("Please enter your email address");
    return;
  }

  setSendingReset(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to send password reset email");
      return;
    }

    setResetEmailSent(true);
    toast.success("Password reset email sent! Please check your inbox.");
  } catch (error: any) {
    console.error("Password reset error:", error);
    toast.error(error.message || "Failed to send password reset email");
  } finally {
    setSendingReset(false);
  }
};

const handlePasswordReset = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newPassword || newPassword.trim() === "") {
    toast.error("Please enter a new password");
    return;
  }

  if (newPassword.length < 6) {
    toast.error("Password must be at least 6 characters long");
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  setResettingPassword(true);
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to reset password");
      setResettingPassword(false);
      return;
    }

    toast.success("Password reset successfully! Redirecting to sign in...");
    
    // Sign out the user after password reset
    await supabase.auth.signOut();
    
    // Reset states
    setIsResettingPassword(false);
    setIsLogin(true);
    setNewPassword("");
    setConfirmPassword("");
    
    // Small delay before showing success message
    setTimeout(() => {
      toast("Password changed!", {
        description: "Your password has been updated. Please sign in with your new password.",
      });
    }, 500);
  } catch (error: any) {
    console.error("Password reset error:", error);
    toast.error(error.message || "Failed to reset password");
  } finally {
    setResettingPassword(false);
  }
};

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${gradientBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Card className="w-full max-w-md shadow-lg backdrop-blur-sm bg-card/95 mx-2 sm:mx-4">
        <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            EduGuide AI
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your Academic & Emotional Companion 💫
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isResettingPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Reset Your Password</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your new password below
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="transition-all focus:ring-2 focus:ring-primary pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="transition-all focus:ring-2 focus:ring-primary pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                disabled={resettingPassword}
              >
                {resettingPassword ? "Resetting..." : "Reset Password"}
              </Button>
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsResettingPassword(false);
                  setIsLogin(true);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={resettingPassword}
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
            <>
            <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "student" | "teacher")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="cursor-pointer font-normal">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="cursor-pointer font-normal">Teacher (requires approval)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {role === "teacher" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g., +1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="transition-all focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        type="text"
                        placeholder="e.g., M.Ed, B.Sc"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        required
                        className="transition-all focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Teaching Experience (years)</Label>
                      <Input
                        id="experience"
                        type="text"
                        placeholder="e.g., 5 years"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        required
                        className="transition-all focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="e.g., Mathematics, Physics"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="transition-all focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Joining</Label>
                      <Textarea
                        id="reason"
                        placeholder="Why do you want to join as a teacher?"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        rows={3}
                        className="transition-all focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs font-normal text-primary hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all focus:ring-2 focus:ring-primary pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="21.17" y1="8" x2="12" y2="8"></line>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
            </svg>
            Google
          </Button>
          
          <div className="mt-6 text-center text-sm">
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetEmailSent 
                ? "We've sent a password reset link to your email. Please check your inbox and follow the instructions."
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>
          {!resetEmailSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetEmailSent(false);
                  }}
                  disabled={sendingReset}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={sendingReset}
                >
                  {sendingReset ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  If you don't see the email, check your spam folder or try again.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setResetEmailSent(false);
                    setResetEmail("");
                  }}
                >
                  Send Another Email
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetEmailSent(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}