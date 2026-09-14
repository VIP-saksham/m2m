import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Users as UsersIcon, ShieldCheck, UserX, Trash2 } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { adminApi } from '../../services/api';

export default function Users() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading, isError } = useQuery({ queryKey: ['adminUsers'], queryFn: () => adminApi.getUsers() });
  const queryClient = useQueryClient();
  const action = useMutation({
    mutationFn: ({ type, id }) => type === 'verify' ? adminApi.verifyUser(id) : type === 'suspend' ? adminApi.suspendUser(id) : adminApi.removeUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
  const filtered = users.filter((user) => `${user.name} ${user.email || ''} ${user.phone}`.toLowerCase().includes(search.toLowerCase()));
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold">Users</h1><p className="text-gray-500">Manage accounts, verification and access. Removed users are notified.</p></div><Card className="overflow-hidden"><div className="border-b p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full rounded-lg border py-2 pl-9 pr-3" /></div></div>{isLoading ? <LoadingSkeleton count={3} /> : isError ? <p className="p-6 text-red-600">Could not load users.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Contact</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y">{filtered.map((user) => <tr key={user.id}><td className="p-4 font-medium"><span className="mr-2 inline-flex rounded-full bg-blue-50 p-2 text-blue-600"><UsersIcon size={15} /></span>{user.name}</td><td className="p-4 capitalize">{user.role}</td><td className="p-4 text-gray-500">{user.email || user.phone}</td><td className="p-4"><Badge status={user.is_active ? user.verification_status : 'suspended'}>{user.is_active ? user.verification_status : 'suspended'}</Badge></td><td className="p-4"><div className="flex gap-1">{user.verification_status !== 'verified' && <button title="Verify" onClick={() => action.mutate({ type: 'verify', id: user.id })} className="rounded p-2 text-green-700 hover:bg-green-50"><ShieldCheck size={16} /></button>}<button title={user.is_active ? 'Suspend' : 'Reinstate'} onClick={() => action.mutate({ type: 'suspend', id: user.id })} className="rounded p-2 text-amber-700 hover:bg-amber-50"><UserX size={16} /></button>{user.role !== 'admin' && <button title="Remove account" onClick={() => window.confirm(`Remove ${user.name}'s access?`) && action.mutate({ type: 'remove', id: user.id })} className="rounded p-2 text-red-700 hover:bg-red-50"><Trash2 size={16} /></button>}</div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-8 text-center text-gray-500">No users found.</p>}</div>}</Card></div></AdminLayout>;
}
