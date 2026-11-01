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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-140px)] flex flex-col">
      <ChatWindow
        contextShopId={shopId}
        contextShopName={shop?.name}
        isFullPage
      />
    </div>
  );
}

