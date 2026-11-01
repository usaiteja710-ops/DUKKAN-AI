import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Clock,
  Users,
  UserCheck,
  TrendingUp,
  Settings,
  ExternalLink,
  Store,
} from 'lucide-react';

export function DashboardSidebar({ shop }) {
  const links = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Bookings Calendar', href: '/dashboard/bookings', icon: Calendar },
    { label: 'Services Menu', href: '/dashboard/services', icon: Sparkles },
    { label: 'Working Hours & Breaks', href: '/dashboard/schedule', icon: Clock },
    { label: 'Staff Specialists', href: '/dashboard/staff', icon: UserCheck },
    { label: 'Customer Directory', href: '/dashboard/customers', icon: Users },
    { label: 'Business Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { label: 'Shop Profile & Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between flex-shrink-0">
      <div className="space-y-6">
        {/* Shop Header Pill */}
        <div className="p-3.5 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {shop?.name || 'My Local Shop'}
              </h4>
              <span className="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                {shop?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* External view link */}
      {shop?.id && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Link
            to={`/shops/${shop.id}`}
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <span>View Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      )}
    </aside>
  );
}

