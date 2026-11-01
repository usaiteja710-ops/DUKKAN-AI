import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Scissors,
  Heart,
  Activity,
  Wrench,
  Smartphone,
  BookOpen,
  Dumbbell,
  Dog,
  Camera,
  Home,
  Grid,
} from 'lucide-react';

const ICON_MAP = {
  Sparkles,
  Scissors,
  Heart,
  Activity,
  Wrench,
  Smartphone,
  BookOpen,
  Dumbbell,
  Dog,
  Camera,
  Home,
  Grid,
};

export function CategoryGrid({ categories = [], selectedSlug = null, onSelectCategory }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {categories.map((cat) => {
        const IconComponent = ICON_MAP[cat.icon] || Grid;
        const isSelected = selectedSlug === cat.slug;

        const Content = (
          <div
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 text-center cursor-pointer group ${
              isSelected
                ? 'bg-brand-50 dark:bg-brand-950/80 border-brand-500 text-brand-700 dark:text-brand-300 shadow-md ring-2 ring-brand-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${
                isSelected
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-50 dark:group-hover:bg-brand-950 group-hover:text-brand-600'
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold leading-tight line-clamp-1">{cat.name}</span>
          </div>
        );

        if (onSelectCategory) {
          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
            >
              {Content}
            </button>
          );
        }

        return (
          <Link key={cat.id || cat.slug} to={`/shops?category=${cat.slug}`}>
            {Content}
          </Link>
        );
      })}
    </div>
  );
}

