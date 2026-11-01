import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient.js';
import { DashboardSidebar } from '../../components/owner/DashboardSidebar.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

export function DashboardLayout() {
  const location = useLocation();

  const {
    data: shop,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['owner-shop'],
    queryFn: () => api.get('/owner/shop'),
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  // If shop not created yet and not currently on onboarding page, redirect to onboarding
  if (!shop && location.pathname !== '/dashboard/onboarding') {
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar shop={shop} />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        <Outlet context={{ shop }} />
      </div>
    </div>
  );
}

