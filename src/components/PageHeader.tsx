interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm sm:text-base text-charcoal/65 leading-relaxed max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
