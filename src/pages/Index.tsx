import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  return null;
};

export default Index;
