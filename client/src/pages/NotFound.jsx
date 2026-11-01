import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Home, Compass, Store } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6 shadow-inner">
        <Store className="w-10 h-10" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
        404
      </h1>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-2">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        The shop page or resource you are looking for may have been moved, renamed, or is currently unavailable.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link to="/">
          <Button variant="primary" size="md">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <Link to="/shops">
          <Button variant="outline" size="md">
            <Compass className="w-4 h-4 mr-2" />
            Discover Shops
          </Button>
        </Link>
      </div>
    </div>
  );
}

