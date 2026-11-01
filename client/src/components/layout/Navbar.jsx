import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Store,
  Sparkles,
  Calendar,
  LayoutDashboard,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Button } from '../ui/Button.jsx';

export function Navbar() {
  const { user, isAuthenticated, isShopkeeper, signOut, setMockRole } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { label: 'Explore Shops', href: '/shops', icon: Compass },
    { label: 'AI Assistant', href: '/assistant', icon: Sparkles, badge: 'AI' },
    ...(isAuthenticated && !isShopkeeper
      ? [{ label: 'My Bookings', href: '/my-bookings', icon: Calendar }]
      : []),
    ...(isShopkeeper
      ? [{ label: 'Shop Dashboard', href: '/dashboard', icon: LayoutDashboard }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/75 dark:bg-[#021024]/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-glass transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-black text-xl text-slate-900 dark:text-white group flex-shrink-0"
            aria-label="DUKKAN AI Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-dukkan-navy via-dukkan-azure to-dukkan-plum flex items-center justify-center text-white shadow-glass-glow group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="tracking-tight text-lg leading-tight flex items-center gap-1">
                DUKKAN <span className="bg-gradient-to-r from-dukkan-azure to-dukkan-sky bg-clip-text text-transparent font-bold">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-dukkan-sky/70 tracking-wider font-semibold uppercase">
                Smart Local Booking
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-dukkan-dustyRose dark:bg-dukkan-plum text-dukkan-currant dark:text-dukkan-dustyRose">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Quick Role Switcher, Dark Mode, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Role Switcher */}
            <div className="hidden lg:flex items-center gap-1 p-1 bg-white/50 dark:bg-dukkan-steel/70 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setMockRole('customer')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'customer'
                    ? 'bg-white dark:bg-dukkan-midnight text-dukkan-azure dark:text-dukkan-sky shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to customer mode"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setMockRole('shopkeeper')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isShopkeeper
                    ? 'bg-white dark:bg-dukkan-midnight text-dukkan-azure dark:text-dukkan-sky shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to shopkeeper mode"
              >
                Shopkeeper
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Dropdown or Login Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  aria-expanded={userDropdownOpen}
                  aria-label="User menu"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Profile'}
                      className="w-8 h-8 rounded-xl object-cover border border-white/40 dark:border-white/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-dukkan-azure to-dukkan-plum text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[110px] truncate">
                    {user.full_name || user.email}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/90 dark:bg-dukkan-steel/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-glass-hover py-2 z-50 animate-slide-up"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.full_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-dukkan-azure/10 text-dukkan-azure dark:text-dukkan-sky border border-dukkan-azure/20">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-dukkan-azure/10"
                    >
                      <User className="w-4 h-4 text-dukkan-azure" />
                      <span>Profile & Settings</span>
                    </Link>

                    {isShopkeeper ? (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-dukkan-azure/10"
                      >
                        <LayoutDashboard className="w-4 h-4 text-dukkan-azure" />
                        <span>Shopkeeper Dashboard</span>
                      </Link>
                    ) : (
                      <Link
                        to="/my-bookings"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-dukkan-azure/10"
                      >
                        <Calendar className="w-4 h-4 text-dukkan-azure" />
                        <span>My Bookings</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 dark:border-white/10 my-1" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm" variant="ghost" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="primary" className="text-xs bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/20 dark:border-white/10 px-4 pt-3 pb-6 space-y-2 bg-white/95 dark:bg-dukkan-midnight/95 backdrop-blur-xl animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-dukkan-azure/15 text-dukkan-azure dark:text-dukkan-sky font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-dukkan-plum text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
