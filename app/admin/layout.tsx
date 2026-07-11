import { AppNav } from "@/components/AppNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      {children}
    </div>
  );
}
