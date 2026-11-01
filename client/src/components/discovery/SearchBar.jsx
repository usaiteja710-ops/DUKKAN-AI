import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function SearchBar({ onSearch, initialQuery = '', initialCity = '', className = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ query: query.trim(), city: city.trim() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row items-center gap-2 p-2.5 glass-card shadow-glass-hover border border-white/50 dark:border-white/10 transition-all ${className}`}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5 flex-1 w-full border-b sm:border-b-0 sm:border-r border-slate-200/50 dark:border-white/10">
        <Search className="w-5 h-5 text-dukkan-azure dark:text-dukkan-sky flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Service, haircut, dentist, spa, car wash..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 flex-1 w-full">
        <MapPin className="w-5 h-5 text-dukkan-azure/70 flex-shrink-0" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, e.g. Visakhapatnam, Hyderabad, Bengaluru"
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <Button
        type="submit"
        size="md"
        className="w-full sm:w-auto px-7 bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white shadow-md hover:shadow-glass-glow"
      >
        Search Shops
      </Button>
    </form>
  );
}
