import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminNotificationApi } from '../../services/api';

export default function AdminNotifications() {
  const [form, setForm] = useState({ title: '', message: '', role: '' });
  const mutation = useMutation({ mutationFn: adminNotificationApi.send, onSuccess: () => setForm({ title: '', message: '', role: '' }) });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Send notification</h1>
        <p className="mb-6 text-sm text-slate-500">Send a clear update to everyone or one user group.</p>
        <Card className="p-6">
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
            <input value={form.title} onChange={set('title')} required placeholder="Notification title" className="w-full rounded-xl border p-3" />
            <textarea value={form.message} onChange={set('message')} required placeholder="Write your message..." rows={5} className="w-full rounded-xl border p-3" />
            <select value={form.role} onChange={set('role')} className="w-full rounded-xl border p-3">
              <option value="">Everyone</option><option value="farmer">Farmers</option><option value="buyer">Buyers</option><option value="processor">Processors</option>
            </select>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Sending...' : 'Send notification'}</Button>
            {mutation.isSuccess && <p className="text-sm text-emerald-700">Notification sent successfully.</p>}
            {mutation.isError && <p className="text-sm text-red-700">{mutation.error?.message || 'Unable to send notification.'}</p>}
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
