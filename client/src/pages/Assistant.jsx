import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient.js';
import { ChatWindow } from '../components/assistant/ChatWindow.jsx';

export function Assistant() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shopId');

  const { data: shop } = useQuery({
    queryKey: ['assistant-shop-context', shopId],
    queryFn: () => api.get(`/shops/${shopId}`),
    enabled: !!shopId,
  });

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-dukkan-azure/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-dukkan-plum/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <ChatWindow
        contextShopId={shopId}
        contextShopName={shop?.name}
        isFullPage
      />
    </div>
  );
}
