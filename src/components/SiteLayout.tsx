import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, ArrowRight, Info, Menu, ShieldAlert, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useFetch } from "@/lib/api";
import type { Notice } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", end: true },
  { to: "/atracoes", label: "Atrações" },
  { to: "/eventos", label: "Eventos" },
  { to: "/seguranca", label: "Segurança" },
];

function NoticeBar() {
  const { data } = useFetch<Notice[]>("/notices");
  const [hidden, setHidden] = useState(() => sessionStorage.getItem("tv-notice") ?? "");
  const top = data?.[0];
  if (!top || hidden === `${top.id}`) return null;
  const urgent = top.severity === "urgente";
  const Icon = urgent ? ShieldAlert : top.severity === "alerta" ? AlertTriangle : Info;
  return (
    <div role="alert" className={cn("text-sm", urgent ? "bg-terra-600 text-white" : top.severity === "alerta" ? "bg-ambar-500 text-floresta-900" : "bg-nevoa-700 text-pedra-50")}>
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2.5 sm:px-8">
        <Icon className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">{top.title}.</strong> <span className="opacity-90">{top.message}</span>{" "}
          <Link to="/seguranca" className="font-semibold underline underline-offset-4">
            {data!.length > 1 ? `Ver os ${data!.length} avisos` : "Saiba mais"}
          </Link>
        </p>
        <button
          aria-label="Fechar aviso"
          className="rounded p-1 hover:bg-black/10"
          onClick={() => (sessionStorage.setItem("tv-notice", `${top.id}`), setHidden(`${top.id}`))}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  const link = ({ isActive }: { isActive: boolean }) =>
    cn("relative py-1 text-sm transition-colors hover:text-floresta-600", isActive ? "text-floresta-800 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-terra-500" : "text-foreground/75");
  return (
    <header className="sticky top-0 z-40 border-b bg-pedra-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-8">
        <Link to="/" aria-label="Circuito Terê Verde — início">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link}>
              {n.label}
            </NavLink>
          ))}
          <Button asChild variant="outline" className="btn-label h-11 rounded-full border-primary px-6 text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/atracoes">
              Planeje sua visita <ArrowRight className="size-4" />
            </Link>
          </Button>
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-pedra-100">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="mt-12 flex flex-col gap-1 px-6" aria-label="Principal">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className="border-b py-4 font-serif text-2xl text-floresta-800">
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-floresta-900 text-pedra-100">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm text-salvia-200">
            Biodiversidade, trilhas, cachoeiras e eventos da Serra dos Órgãos e das montanhas de Teresópolis, reunidos para você visitar com segurança e respeito.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-ambar-300">Explorar</h4>
          <ul className="space-y-2 text-sm text-salvia-200">
            {NAV.slice(1).map((n) => (
              <li key={n.to}>
                <Link className="hover:text-pedra-50" to={n.to}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-ambar-300">Emergências</h4>
          <ul className="space-y-2 text-sm text-salvia-200">
            <li>Corpo de Bombeiros: <strong className="text-pedra-50">193</strong></li>
            <li>SAMU: <strong className="text-pedra-50">192</strong></li>
            <li>Polícia Militar: <strong className="text-pedra-50">190</strong></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-pedra-100/10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-nevoa-300 sm:px-8">
          <span>MVP acadêmico — Back-End para MVP, UNIFESO · Circuito Terê Verde, Teresópolis</span>
          <Link to="/admin" className="hover:text-pedra-50">
            Área administrativa
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-svh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3">
        Ir para o conteúdo
      </a>
      <NoticeBar />
      <Header />
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
