import { Landscape } from "@/components/Landscape";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Media({ imageKey, alt, seed, variant, className }: { imageKey?: string | null; alt: string; seed: number; variant?: string; className?: string }) {
  const src = mediaUrl(imageKey);
  return (
    <div className={cn("overflow-hidden bg-floresta-700", className)}>
      {src ? <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" /> : <Landscape seed={seed} variant={variant} />}
    </div>
  );
}
