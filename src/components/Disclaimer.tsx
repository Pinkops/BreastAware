import { Info } from 'lucide-react';

interface Props {
  compact?: boolean;
  className?: string;
}

export default function Disclaimer({ compact = false, className = '' }: Props) {
  if (compact) {
    return (
      <p className={`text-xs text-charcoal/55 leading-relaxed ${className}`}>
        BreastAware helps you organize personal observations. It does not diagnose cancer or replace professional care.
      </p>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-white/80 p-4 flex gap-3 ${className}`}>
      <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" aria-hidden />
      <div className="text-sm text-charcoal/75 leading-relaxed">
        <p className="font-medium text-charcoal mb-1">Important</p>
        <p>
          BreastAware is a private personal organizer for breast self-awareness, observation tracking,
          screening history, and appointment preparation. It is <strong>not</strong> a diagnostic tool,
          cancer detector, risk calculator, or substitute for a clinician, mammogram, ultrasound, MRI,
          biopsy, or treatment. If you notice a change that concerns you, contact a healthcare professional.
        </p>
      </div>
    </div>
  );
}
