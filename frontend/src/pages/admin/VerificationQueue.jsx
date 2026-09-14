import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Check, X, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function VerificationQueue() {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { success: toastSuccess } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['unverifiedUsers', roleFilter],
    queryFn: () => adminApi.getUsers({ verification_status: 'unverified' })
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => adminApi.verifyUser(id),
    onSuccess: () => {
      toastSuccess(t('common.success'), '');
      queryClient.invalidateQueries({ queryKey: ['unverifiedUsers'] });
    }
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => adminApi.suspendUser(id),
    onSuccess: () => {
      toastSuccess(t('common.success'), '');
      queryClient.invalidateQueries({ queryKey: ['unverifiedUsers'] });
    }
  });

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = `${user.name} ${user.email || ''} ${user.phone || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('verification.title')}</h1>
        <p className="text-gray-600 mt-1">{t('verification.pendingUsers')}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('common.all')} {t('common.role')}s</option>
              <option value="farmer">{t('auth.farmer')}</option>
              <option value="processor">{t('auth.processor')}</option>
            </select>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search') + '...'}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="p-4">{t('common.name')}</th>
                <th className="p-4">{t('common.role')}</th>
                <th className="p-4">{t('common.contact')}</th>
                <th className="p-4">{t('common.location')}</th>
                <th className="p-4">{t('common.date')}</th>
                <th className="p-4">{t('common.status')}</th>
                <th className="p-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isError ? (
                <tr><td colSpan="7" className="p-8 text-center text-red-600">{t('common.failedToLoad')}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{user.name}</td>
                    <td className="p-4 capitalize">{user.role}</td>
                    <td className="p-4 text-sm text-gray-600">
                      <div>{user.phone}</div>
                      <div>{user.email}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{user.state}</td>
                    <td className="p-4 text-sm text-gray-600">{user.joined_at}</td>
                    <td className="p-4">
                      <Badge variant="warning">{user.verification_status}</Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-600 text-green-600 hover:bg-green-50"
                        onClick={() => verifyMutation.mutate(user.id)}
                        disabled={verifyMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> {t('admin.verify')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        onClick={() => suspendMutation.mutate(user.id)}
                        disabled={suspendMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> {t('admin.suspend')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
