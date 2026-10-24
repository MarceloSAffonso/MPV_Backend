import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/admin/AdminHeader";
import { useSession } from "@/admin/session";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { sanitizeEmail } from "@/lib/utils";

const sanitizeName = (value: string) => value.replace(/[^\p{L}\p{M}' .-]/gu, "").slice(0, 80);

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={shown ? "text" : "password"} autoComplete={autoComplete} required maxLength={128} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 bg-background pr-11" />
      <button type="button" aria-label={shown ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShown((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, loading, setUser } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (loading) return <Skeleton className="m-8 h-40" />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const unchanged = name.trim() === user.name && email === user.email;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileError("");
    try {
      const updated = await api<User>("/admin/profile", { method: "PUT", json: { name, email } });
      setUser(updated);
      toast.success("Dados atualizados");
    } catch (err) {
      setProfileError((err as Error).message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwError("");
    if (next !== confirm) {
      setPwError("A confirmação não confere com a nova senha");
      return;
    }
    setPwBusy(true);
    try {
      await api("/admin/password", { method: "PUT", json: { current_password: current, new_password: next } });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Senha alterada");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <AdminHeader />
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-8">
        <Link to="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar ao painel</Link>
        <span className="eyebrow">Minha conta</span>
        <h1 className="mb-8 mt-3 text-4xl">Dados de acesso</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">Nome e e-mail</CardTitle>
            <CardDescription>O e-mail é usado para entrar no painel. Aceita letras sem acento, números e os símbolos . _ % + -</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(sanitizeName(e.target.value))} className="h-11 bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required maxLength={254} inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(sanitizeEmail(e.target.value))} className="h-11 bg-background" />
              </div>
              {profileError && <Alert variant="destructive" role="alert"><AlertDescription>{profileError}</AlertDescription></Alert>}
              <Button type="submit" disabled={profileBusy || unchanged} className="btn-label h-11 rounded-full px-6">
                {profileBusy && <Loader2 className="size-4 animate-spin" />} Salvar dados
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">Alterar senha</CardTitle>
            <CardDescription>Mínimo de 8 caracteres, com ao menos uma letra e um número.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="current">Senha atual</Label>
                <PasswordInput id="current" value={current} onChange={setCurrent} autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next">Nova senha</Label>
                <PasswordInput id="next" value={next} onChange={setNext} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <PasswordInput id="confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
              </div>
              {pwError && <Alert variant="destructive" role="alert"><AlertDescription>{pwError}</AlertDescription></Alert>}
              <Button type="submit" disabled={pwBusy || !current || !next || !confirm} className="btn-label h-11 rounded-full px-6">
                {pwBusy && <Loader2 className="size-4 animate-spin" />} Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
