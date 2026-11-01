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
      className={`flex flex-col sm:flex-row items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg transition-all ${className}`}
    >
      <div className="flex items-center gap-3 px-3.5 py-2 flex-1 w-full border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800">
        <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Service, haircut, dentist, spa..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2 flex-1 w-full">
        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, e.g. Visakhapatnam, Hyderabad"
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <Button type="submit" size="md" className="w-full sm:w-auto px-6">
        Search
      </Button>
    </form>
  );
}

