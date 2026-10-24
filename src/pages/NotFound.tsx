import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-28 text-center sm:px-8">
      <span className="eyebrow">Erro 404</span>
      <h1 className="mt-4 text-5xl">Essa trilha não leva a lugar nenhum.</h1>
      <p className="mt-4 text-muted-foreground">A página que você procura não existe ou mudou de lugar.</p>
      <Button asChild className="btn-label mt-8 h-12 rounded-full px-7"><Link to="/">Voltar ao início</Link></Button>
    </div>
  );
}
