import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminAlertsPage = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getAlerts();
      if (res.success) {
        setAlerts(res.alerts || []);
      }
    } catch (err) {
      toast.error('Failed to evaluate system alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Alerts & System Health</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Actionable operational alerts, pending user approval spikes, and tenant database connectivity monitoring.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Evaluate Telemetry
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-5 rounded-2xl border flex items-start justify-between gap-4 transition-all shadow-sm ${
                al.severity === 'danger'
                  ? 'bg-red-50/60 border-red-200 text-red-950'
                  : al.severity === 'warning'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-blue-50/60 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    al.severity === 'danger'
                      ? 'bg-red-100 text-red-600'
                      : al.severity === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{al.title}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/80 border">
                      {al.companyCode}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-700 leading-relaxed">{al.message}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                {al.timestamp ? new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-2">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">All Systems Operational</h3>
          <p className="text-xs text-slate-500">No active alerts or connectivity anomalies detected across company tenants.</p>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAlertsPage;
