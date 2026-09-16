import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/50 px-6 py-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-forest/8 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-forest" aria-hidden />
      </div>
      <h3 className="font-display text-lg text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-charcoal/65 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
