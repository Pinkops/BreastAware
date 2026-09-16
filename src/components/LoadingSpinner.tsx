export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-live="polite">
      <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-charcoal/60">{label}</p>
    </div>
  );
}
