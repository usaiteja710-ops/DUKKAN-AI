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
            className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 text-center cursor-pointer group ${
              isSelected
                ? 'bg-gradient-to-tr from-dukkan-navy to-dukkan-azure text-white shadow-glass-glow border border-dukkan-azure'
                : 'glass-card text-slate-700 dark:text-slate-200 hover:border-dukkan-azure/40 hover:shadow-glass-hover'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-white/60 dark:bg-dukkan-midnight/80 text-dukkan-azure dark:text-dukkan-sky group-hover:bg-dukkan-azure/10'
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight line-clamp-1">{cat.name}</span>
          </div>
        );

        return onSelectCategory ? (
          <button
            key={cat.id || cat.slug}
            type="button"
            onClick={() => onSelectCategory(cat.slug)}
            className="text-left w-full focus:outline-none"
          >
            {Content}
          </button>
        ) : (
          <Link key={cat.id || cat.slug} to={`/shops?category=${cat.slug}`}>
            {Content}
          </Link>
        );
      })}
    </div>
  );
}
