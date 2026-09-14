import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { notificationApi } from '../../services/api';

export default function Notifications({ Layout = FarmerLayout }) {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    refetchInterval: 15000,
  });
  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-1 text-sm text-charcoal/60">Updates about your batches, opportunities and messages.</p></div>
          <button type="button" onClick={() => markAll.mutate()} className="text-sm font-semibold text-forest hover:text-leaf">Mark all read</button>
        </div>
        {isLoading ? <LoadingSkeleton count={4} /> : isError ? (
          <Card className="p-6 text-red-700">Notifications could not be loaded. Please refresh and try again.</Card>
        ) : notifications.length === 0 ? (
          <Card className="p-10 text-center text-charcoal/60"><Bell className="mx-auto mb-3 text-charcoal/30" /><p>No notifications yet.</p></Card>
        ) : (
          <div className="space-y-3">{notifications.map((item) => (
            <Card key={item.id} className={`p-4 ${item.is_read ? 'bg-white' : 'border-l-4 border-l-leaf bg-leaf/5'}`}>
              <div className="flex items-start gap-3"><div className="rounded-xl bg-leaf/10 p-2 text-leaf"><Bell size={18} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h2 className="font-semibold">{item.title}</h2>{!item.is_read && <button type="button" onClick={() => markRead.mutate(item.id)} className="text-xs text-forest"><Check size={16} /></button>}</div><p className="mt-1 text-sm text-charcoal/70">{item.message}</p><p className="mt-2 text-xs text-charcoal/40">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p></div></div>
            </Card>
          ))}</div>
        )}
      </div>
    </Layout>
  );
}
