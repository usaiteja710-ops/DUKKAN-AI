import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient.js';
import { ShopCard } from '../components/discovery/ShopCard.jsx';
import { ShopCardSkeleton } from '../components/ui/Skeleton.jsx';
import { SearchBar } from '../components/discovery/SearchBar.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Filter, Star, Compass, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export function Shops() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const city = searchParams.get('city') || '';
  const minRating = Number(searchParams.get('minRating') || 0);
  const sort = searchParams.get('sort') || 'rating';
  const page = Number(searchParams.get('page') || 1);

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  // Fetch shops with active filters
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['shops', query, category, city, minRating, sort, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (minRating > 0) params.set('minRating', minRating);
      if (sort) params.set('sort', sort);
      params.set('page', page);
      params.set('limit', 12);
      return api.get(`/shops?${params.toString()}`);
    },
  });

  const shops = data?.shops || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  const handleSearch = ({ query: newQuery, city: newCity }) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newQuery) nextParams.set('q', newQuery);
    else nextParams.delete('q');

    if (newCity) nextParams.set('city', newCity);
    else nextParams.delete('city');

    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Discover Local Businesses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore verified salons, barbers, clinics, spas, and repair shops with real-time open slots
          </p>
        </div>

        <SearchBar
          onSearch={handleSearch}
          initialQuery={query}
          initialCity={city}
          className="max-w-3xl"
        />
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Min Rating Dropdown */}
          <select
            value={minRating}
            onChange={(e) => updateParam('minRating', e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="0">Any Rating</option>
            <option value="4.5">★ 4.5 & up</option>
            <option value="4.0">★ 4.0 & up</option>
            <option value="3.5">★ 3.5 & up</option>
          </select>

          {/* Reset Filters */}
          {(query || category || city || minRating > 0) && (
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none font-semibold"
          >
            <option value="rating">Highest Rated</option>
            <option value="name">Alphabetical (A-Z)</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <ShopCardSkeleton key={n} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Failed to load shops"
          description={error?.message || 'Please check your connection and try again.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : shops.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No matching shops found"
          description="Try relaxing your search terms, choosing a different city, or clearing your category filters."
          actionLabel="Clear all filters"
          onAction={() => setSearchParams({})}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', page - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-xs font-semibold text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => updateParam('page', page + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

