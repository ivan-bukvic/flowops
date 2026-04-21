import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      navigate("/create-workspace", { replace: true });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* LEFT — visual area */}
      <div className="relative hidden md:block overflow-hidden border-r border-border">
        {/* Background layer: dots + fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--primary) / 0.09) 1.5px, transparent 1.5px)",
            backgroundSize: "16px 16px",
            maskImage:
              "linear-gradient(to right, black 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 80%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 80%, transparent 100%)",
          }}
        />
        {/* Content layer */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-[2.1rem]" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-[1.75rem] leading-[1.25] font-semibold text-foreground">
              Build your workspace
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Organize projects, automate workflows, and collaborate with your team - all in one place.
            </p>
          </div>
          <div />
        </div>
      </div>

      {/* RIGHT — form area */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-[420px] space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground">
              Get started with your free workspace.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
