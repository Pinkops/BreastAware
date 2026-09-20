import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Home,
  BookOpen,
  Map,
  CalendarHeart,
  MoreHorizontal,
  Heart,
  NotebookPen,
  Stethoscope,
  FolderLock,
  GraduationCap,
  Settings,
  FileText,
  CircleDot,
  ClipboardList,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const mobileNav = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/body-map', label: 'Body Map', icon: Map },
  { to: '/screening', label: 'Screening', icon: CalendarHeart },
  { to: '/more', label: 'More', icon: MoreHorizontal },
];

const sideNav = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/know-my-normal', label: 'Know My Normal', icon: CircleDot },
  { to: '/log-change', label: 'Log a Change', icon: NotebookPen },
  { to: '/journal', label: 'My Journal', icon: BookOpen },
  { to: '/body-map', label: 'Body Map', icon: Map },
  { to: '/screening', label: 'Screening & Risk', icon: CalendarHeart },
  { to: '/doctor-prep', label: 'Doctor Prep', icon: Stethoscope },
  { to: '/visit-readiness', label: 'Visit Readiness', icon: ClipboardList },
  { to: '/summary', label: 'Health Summary', icon: FileText },
  { to: '/vault', label: 'Health Vault', icon: FolderLock },
  { to: '/education', label: 'Education Center', icon: GraduationCap },
  { to: '/settings', label: 'Settings & Privacy', icon: Settings },
];

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-forest focus:text-white focus:shadow-lg">
        Skip to main content
      </a>

      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-border bg-white/70 backdrop-blur-sm sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center"><Heart className="w-5 h-5 text-ivory fill-ivory/20" strokeWidth={1.75} /></div>
            <div><p className="font-display text-lg tracking-tight text-charcoal leading-none">BreastAware</p><p className="text-[11px] text-charcoal/60 mt-0.5 tracking-wide uppercase">Private companion</p></div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Main">
          {sideNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest/40 ${isActive ? 'bg-forest text-ivory font-medium shadow-sm' : 'text-charcoal/70 hover:bg-forest/6 hover:text-charcoal'}`}>
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />{item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-border"><p className="text-xs text-charcoal/60 truncate">{user?.email}</p><p className="text-[11px] text-charcoal/55 mt-1 leading-snug">Know your normal. Notice changes. Keep a record.</p></div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-30 bg-ivory/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center"><Heart className="w-4 h-4 text-ivory" strokeWidth={1.75} /></div>
          <div className="min-w-0"><p className="font-display text-base text-charcoal leading-none">BreastAware</p><p className="text-[10px] text-charcoal/60 truncate">{location.pathname === '/' ? 'Your private space' : ''}</p></div>
        </header>

        {!isOnline && (
          <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-xs px-4 py-2 flex items-center gap-2" role="status" aria-live="polite">
            <WifiOff className="w-3.5 h-3.5" /><span>You are offline — your private data is not available offline. Changes will sync when you are back online.</span>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 px-4 sm:px-6 lg:px-10 py-5 sm:py-8 max-w-5xl w-full mx-auto focus:outline-none">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border safe-bottom" aria-label="Mobile">
        <div className="flex items-stretch justify-around px-1 pt-1 pb-1">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[3.75rem] min-h-[44px] rounded-xl text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest/40 ${isActive ? 'text-forest bg-forest/8' : 'text-charcoal/60'}`}>
                <Icon className="w-5 h-5" strokeWidth={1.75} />{item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
