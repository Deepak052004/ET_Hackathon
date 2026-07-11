import React, { useEffect, useRef } from 'react';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import SkeletonLoader from '../ui/SkeletonLoader';
import { Activity } from 'lucide-react';

export default function SensorGrid({ sensors, loading }) {
  if (loading) {
    return (
      <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sensor UID</th>
              <th>Type</th>
              <th>Value</th>
              <th>Status</th>
              <th>Zone</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i}>
                <td colSpan={5} className="py-2"><SkeletonLoader height="32px" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!sensors || sensors.length === 0) {
    return <EmptyState icon={Activity} message="No sensor data — awaiting socket connection" />;
  }

  return (
    <div className="max-h-64 overflow-y-auto no-scrollbar">
      <table className="data-table relative">
        <thead className="bg-slate-900 sticky top-0 z-10">
          <tr>
            <th>Sensor UID</th>
            <th>Type</th>
            <th>Value</th>
            <th>Status</th>
            <th>Zone</th>
            <th>W.Thresh</th>
            <th>C.Thresh</th>
          </tr>
        </thead>
        <tbody>
          {sensors.map(sensor => (
            <SensorRow key={sensor.sensor_uid} sensor={sensor} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SensorRow({ sensor }) {
  const rowRef = useRef(null);
  const prevStatus = useRef(sensor.status);

  useEffect(() => {
    if (prevStatus.current !== sensor.status && rowRef.current) {
      rowRef.current.classList.add('bg-slate-700/50', 'transition-colors', 'duration-300');
      setTimeout(() => {
        if (rowRef.current) {
          rowRef.current.classList.remove('bg-slate-700/50');
        }
      }, 1000);
      prevStatus.current = sensor.status;
    }
  }, [sensor.status]);

  let valueColor = 'text-emerald-400';
  if (sensor.status === 'critical') valueColor = 'text-red-400';
  else if (sensor.status === 'warning') valueColor = 'text-amber-400';

  return (
    <tr ref={rowRef}>
      <td className="font-mono text-xs text-slate-300">
        {sensor.sensor_uid}
        {sensor.is_anomaly && <span className="ml-2 text-[10px] bg-red-900 text-red-300 px-1 rounded-sm">ANOM</span>}
      </td>
      <td className="text-xs">{sensor.type}</td>
      <td className={`font-mono font-semibold ${valueColor}`}>
        {sensor.current_value !== undefined ? sensor.current_value : sensor.value} <span className="text-xs font-sans font-normal text-slate-400">{sensor.unit}</span>
      </td>
      <td><StatusBadge status={sensor.status} /></td>
      <td className="text-xs text-slate-400">Zone {sensor.zone_id}</td>
      <td className="font-mono text-xs text-slate-500">{sensor.threshold_warning}</td>
      <td className="font-mono text-xs text-slate-500">{sensor.threshold_critical}</td>
    </tr>
  );
}
