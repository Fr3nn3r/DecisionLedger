import { NavLink } from 'react-router-dom';
import {
  FileText,
  PlayCircle,
  BarChart3,
  Shield,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import trueaimLogo from '@/assets/trueaim-logo.png';

const navItems = [
  { to: '/claims', label: 'Claims', icon: FileText },
  { to: '/decision-runs', label: 'Decision Runs', icon: PlayCircle },
  { to: '/qa-impact', label: 'QA Impact', icon: BarChart3 },
  { to: '/governance', label: 'Governance', icon: Shield },
  { to: '/catalogs', label: 'Catalogs', icon: BookOpen },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <img src={trueaimLogo} alt="TrueAim" className="h-8 w-auto dark:brightness-0 dark:invert" />
        <span className="text-lg font-semibold text-sidebar-foreground">
          Decision Ledger
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">v0.1.0</p>
      </div>
    </aside>
  );
}
