import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, UserRound } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Card from '../ui/Card';

const assetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const filename = path.split(/[\\/]/).pop();
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${filename}`;
};

export default function ProfileSettings({ Layout }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', location: user?.location || '' });
  const [avatar, setAvatar] = useState(null);
  const mutation = useMutation({
    mutationFn: () => {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (avatar) data.append('avatar', avatar);
      return authApi.updateProfile(data);
    },
    onSuccess: updateUser,
  });
  const image = useMemo(() => assetUrl(user?.avatar_path), [user?.avatar_path]);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div><h1 className="text-2xl font-bold">Your profile</h1><p className="mt-1 text-sm text-charcoal/60">Keep your details and profile photo up to date.</p></div>
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-forest text-2xl font-bold text-white">
              {image ? <img src={image} alt="Profile" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center">{user?.name?.[0]?.toUpperCase() || <UserRound />}</div>}
              <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-white p-1 text-forest shadow"><Camera size={15} /><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} /></label>
            </div>
            <div><p className="font-semibold">{user?.name}</p><p className="text-sm text-charcoal/60">{user?.role}</p></div>
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
            <input value={form.name} onChange={set('name')} required placeholder="Full name" className="rounded-xl border p-3" />
            <input value={form.phone} onChange={set('phone')} required placeholder="Phone" className="rounded-xl border p-3" />
            <input value={form.email} onChange={set('email')} placeholder="Email" className="rounded-xl border p-3" />
            <input value={form.location} onChange={set('location')} placeholder="Location" className="rounded-xl border p-3" />
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save profile'}</Button>
            {mutation.isSuccess && <p className="self-center text-sm text-emerald-700">Profile updated.</p>}
            {mutation.isError && <p className="self-center text-sm text-red-700">{mutation.error?.message || 'Unable to update profile.'}</p>}
          </form>
        </Card>
      </div>
    </Layout>
  );
}
