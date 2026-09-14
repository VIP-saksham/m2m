import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { adminApi } from '../../services/api';

export default function AuditLogs() {
  const { data: logs = [], isLoading, isError } = useQuery({ queryKey: ['adminAuditLogs'], queryFn: () => adminApi.auditLogs() });
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold">Audit logs</h1><p className="text-gray-500">A clear record of important admin and network actions.</p></div><Card className="overflow-hidden">{isLoading ? <LoadingSkeleton count={4} /> : isError ? <p className="p-6 text-red-600">Could not load audit logs.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Action</th><th className="p-4">Entity</th><th className="p-4">Actor</th><th className="p-4">Time</th></tr></thead><tbody className="divide-y">{logs.map((log) => <tr key={log.id}><td className="p-4 font-semibold">{log.action}</td><td className="p-4">{log.entity_type} #{log.entity_id || '-'}</td><td className="p-4">{log.actor_id || 'System'}</td><td className="p-4 text-gray-500">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td></tr>)}</tbody></table>{logs.length === 0 && <p className="p-8 text-center text-gray-500">No audit events yet.</p>}</div>}</Card></div></AdminLayout>;
}
