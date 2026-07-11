import React from 'react';
import AlertRow from './AlertRow';
import SkeletonLoader from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import ErrorBanner from '../ui/ErrorBanner';
import { BellOff } from 'lucide-react';

export default function AlertTable({ alerts, loading, error, onAction }) {
  if (error && (!alerts || alerts.length === 0)) {
    return <ErrorBanner message={error} />;
  }

  if (loading && (!alerts || alerts.length === 0)) {
    return (
      <div className="overflow-x-auto no-scrollbar max-h-full">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>Pri Score</th>
              <th>UID</th>
              <th>Title</th>
              <th>Source</th>
              <th>Zone</th>
              <th>SLA</th>
              <th className="text-center">Escalations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td colSpan={10} className="py-2"><SkeletonLoader height="40px" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return <EmptyState icon={BellOff} message="No alerts match current filters" />;
  }

  return (
    <div className="overflow-x-auto no-scrollbar max-h-[calc(100vh-200px)]">
      <table className="data-table">
        <thead className="bg-slate-900 sticky top-0 z-10">
          <tr>
            <th className="w-8"></th>
            <th>Pri Score</th>
            <th>UID</th>
            <th>Title</th>
            <th>Source</th>
            <th>Zone</th>
            <th>SLA</th>
            <th className="text-center">Escalations</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map(alert => (
            <AlertRow key={alert.alert_uid} alert={alert} onAction={onAction} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
