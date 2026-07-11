import { Sidebar } from "@/components/layout/Sidebar";
import { Sparkles } from "lucide-react";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Sparkles size={22} />
          </div>
          <h1 className="text-[18px] font-semibold text-ink-900">{title}</h1>
          <p className="max-w-sm text-[13.5px] text-ink-500">{description}</p>
          <span className="mt-1 rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-ink-500">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
