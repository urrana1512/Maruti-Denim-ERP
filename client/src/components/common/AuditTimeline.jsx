import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, User, Activity, Loader2 } from 'lucide-react';
import api from '../../services/api';

const AuditTimeline = ({ module = 'GATE_PASS', entityId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityId) return;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/audit-logs/timeline/${module}/${entityId}`);
        if (response.data?.success) {
          setEvents(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching audit timeline:', err);
        setError('Unable to load timeline history.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [module, entityId]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
        <Loader2 className="h-4 w-4 animate-spin text-[#111827]" /> Loading history timeline…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl text-xs text-[#DC2626]">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#9CA3AF]">
        No audit activity recorded for this item yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-[#111827] uppercase tracking-wider">
        <Activity size={14} className="text-[#6B7280]" /> Activity Timeline History
      </div>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EBEFF2]">
        {events.map((event, idx) => {
          const isLatest = idx === events.length - 1;
          return (
            <div key={event._id || idx} className="relative flex flex-col gap-1 text-xs">
              <div className={`absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isLatest ? 'bg-[#059669] ring-2 ring-[#ECFDF5]' : 'bg-[#9CA3AF]'
              }`} />
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111827] flex items-center gap-1.5">
                  {event.description || event.action}
                </span>
                <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 font-mono">
                  <Clock size={11} />
                  {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  }) : ''}
                </span>
              </div>
              <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <User size={11} />
                <span>By {event.actorName || 'System'} ({event.actorRole || 'N/A'})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTimeline;
