import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const redirectParam = params.get("redirect");

  if (redirectParam) {
    localStorage.setItem("login_redirect", redirectParam);
  }
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
  setError(error.message);
  setIsSubmitting(false);
} else {
  const redirect =
    localStorage.getItem("login_redirect") || "/dashboard";

  localStorage.removeItem("login_redirect");

  navigate(redirect, { replace: true });
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 p-6">
        <h1 className="text-3xl font-bold text-foreground">Login</h1>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
