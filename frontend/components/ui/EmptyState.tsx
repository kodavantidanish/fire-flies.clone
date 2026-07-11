import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 border border-dashed border-gray-200 bg-white py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-ink-900">{title}</p>
        {description && <p className="mt-1 max-w-sm text-[13px] text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
