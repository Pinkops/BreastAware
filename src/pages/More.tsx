import { Link } from 'react-router-dom';
import {
  CircleDot,
  NotebookPen,
  Stethoscope,
  FileText,
  FolderLock,
  GraduationCap,
  Settings,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Disclaimer from '../components/Disclaimer';

const links = [
  { to: '/know-my-normal', label: 'Know My Normal', desc: 'Describe your personal baseline', icon: CircleDot },
  { to: '/log-change', label: 'Log a Change', desc: 'Record a new observation', icon: NotebookPen },
  { to: '/doctor-prep', label: 'Doctor Prep', desc: 'Questions and visit notes', icon: Stethoscope },
  { to: '/visit-readiness', label: 'Visit Readiness', desc: 'Prepare answers clinicians may ask', icon: ClipboardList },
  { to: '/summary', label: 'Visit Summary', desc: 'Clinician conversation packet', icon: FileText },
  { to: '/vault', label: 'Health Vault', desc: 'Secure document storage', icon: FolderLock },
  { to: '/education', label: 'Education Center', desc: 'Plain-language topics', icon: GraduationCap },
  { to: '/settings', label: 'Settings & Privacy', desc: 'Export, delete, account', icon: Settings },
];

export default function More() {
  return (
    <div className="space-y-6">
      <PageHeader title="More" subtitle="Additional tools for awareness, preparation, and privacy." />
      <nav className="space-y-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-soft hover:border-forest/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-forest" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal">{l.label}</p>
                <p className="text-xs text-charcoal/50">{l.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-charcoal/30" />
            </Link>
          );
        })}
      </nav>
      <Disclaimer compact />
    </div>
  );
}
