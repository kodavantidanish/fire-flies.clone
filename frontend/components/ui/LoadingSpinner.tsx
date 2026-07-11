import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-16 text-ink-500", className)}>
      <Loader2 className="animate-spin text-brand-500" size={22} />
      {label && <span className="text-[13px]">{label}</span>}
    </div>
  );
}
