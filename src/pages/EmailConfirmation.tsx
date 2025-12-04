import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Since we're disabling email confirmation, just redirect to login
    const type = searchParams.get("type");
    
    if (type === "signup") {
      toast.success("Account created successfully! You can now sign in.");
    } else {
      toast.info("Email confirmation is disabled. You can sign in directly.");
    }
    
    // Redirect to auth page
    setTimeout(() => {
      navigate("/auth");
    }, 2000);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Email Confirmation Disabled</h2>
        <p className="mb-4">Email confirmation is currently disabled for this application.</p>
        <p>You will be redirected to the login page shortly...</p>
      </div>
    </div>
  );
};

export default EmailConfirmation;
