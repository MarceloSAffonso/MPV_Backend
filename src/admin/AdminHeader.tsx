import { Link } from "react-router-dom";
import { LogOut, UserCog } from "lucide-react";
import { useSession } from "@/admin/session";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const { user, logout } = useSession();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-8">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-sm text-muted-foreground sm:block">{user?.name}</span>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/admin/conta"><UserCog className="size-4" /> Minha conta</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={logout}><LogOut className="size-4" /> Sair</Button>
        </div>
      </div>
    </header>
  );
}
