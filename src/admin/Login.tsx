import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSession } from "@/admin/session";
import { Landscape } from "@/components/Landscape";
import { Logo } from "@/components/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeEmail } from "@/lib/utils";

export default function Login() {
  const { user, login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-floresta-800 p-4">
      <div className="absolute inset-0 opacity-40"><Landscape seed={3} variant="trilha" /></div>
      <div className="absolute inset-0 bg-floresta-900/60" />
      <Card className="relative w-full max-w-md shadow-2xl">
        <CardContent className="space-y-6 p-8">
          <Link to="/" className="block"><Logo /></Link>
          <div>
            <h1 className="text-3xl">Área administrativa</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre para atualizar atrações, eventos e avisos.</p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(sanitizeEmail(e.target.value))} maxLength={254} inputMode="email" className="h-11 bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-background" />
            </div>
            {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" disabled={busy} className="btn-label h-12 w-full rounded-full">
              {busy && <Loader2 className="size-4 animate-spin" />} Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
