import { useOrg } from "@/contexts/OrgContext";

const Dashboard = () => {
  const { selectedOrgId } = useOrg();

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-bold text-foreground mb-4">Workspace Overview</h1>
      <p className="text-sm text-muted-foreground mb-2">
        Current Org ID: <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{selectedOrgId}</code>
      </p>
      <p className="text-muted-foreground">Dashboard ready.</p>
    </main>
  );
};

export default Dashboard;
