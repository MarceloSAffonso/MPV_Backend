import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b bg-pedra-50">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-12 sm:px-8 md:grid-cols-2 md:items-end md:py-16">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-4 text-4xl sm:text-5xl [&_em]:text-terra-500">{title}</h1>
        </div>
        {children && <p className="max-w-prose text-muted-foreground">{children}</p>}
      </div>
    </section>
  );
}
