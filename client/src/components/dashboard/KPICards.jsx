import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  PieChart,
  CheckCheck,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

/**
 * Animated Counter Component for subtle count-up effect on initial load
 */
const CountUp = ({ value, precision = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp = null;
    const duration = 500; // 500ms smooth count-up

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = easeProgress * end;

      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  if (precision > 0) {
    return displayValue.toLocaleString('en-IN', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  }

  return Math.round(displayValue).toLocaleString('en-IN');
};

const KPICards = ({ summary = {}, loading = false }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Total Gate Passes',
      value: summary.totalGatePasses || 0,
      icon: FileText,
      badgeText: 'All Records',
      color: 'border-l-blue-600 text-blue-700 bg-blue-50/60 hover:border-blue-700',
      iconBg: 'bg-blue-100 text-blue-700',
      destination: '/gate-pass/manage'
    },
    {
      title: 'Pending Approvals',
      value: summary.pendingGatePasses || 0,
      icon: Clock,
      badgeText: 'Awaiting Action',
      color: 'border-l-amber-500 text-amber-700 bg-amber-50/60 hover:border-amber-600',
      iconBg: 'bg-amber-100 text-amber-700',
      destination: '/gate-pass/manage?status=Pending'
    },
    {
      title: 'Approved Passes',
      value: summary.approvedGatePasses || 0,
      icon: CheckCircle2,
      badgeText: 'Verified & Active',
      color: 'border-l-emerald-500 text-emerald-700 bg-emerald-50/60 hover:border-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-700',
      destination: '/gate-pass/manage?status=Approved'
    },
    {
      title: 'Material Currently Out',
      value: summary.materialCurrentlyOut || 0,
      precision: 2,
      suffix: ' Qty',
      icon: PackageCheck,
      badgeText: 'Field Inventory',
      color: 'border-l-indigo-500 text-indigo-700 bg-indigo-50/60 hover:border-indigo-600',
      iconBg: 'bg-indigo-100 text-indigo-700',
      destination: '/reports?tab=returnable-material'
    },
    {
      title: 'Returnable Pending',
      value: summary.returnablePending || 0,
      icon: RefreshCw,
      badgeText: '0% Returned',
      color: 'border-l-purple-500 text-purple-700 bg-purple-50/60 hover:border-purple-600',
      iconBg: 'bg-purple-100 text-purple-700',
      destination: '/reports?tab=pending-returns'
    },
    {
      title: 'Partially Returned',
      value: summary.partiallyReturned || 0,
      icon: PieChart,
      badgeText: 'In-Progress Inwards',
      color: 'border-l-sky-500 text-sky-700 bg-sky-50/60 hover:border-sky-600',
      iconBg: 'bg-sky-100 text-sky-700',
      destination: '/reports?tab=pending-returns'
    },
    {
      title: 'Fully Returned / Closed',
      value: summary.fullyReturnedClosed || 0,
      icon: CheckCheck,
      badgeText: 'Completed',
      color: 'border-l-teal-600 text-teal-700 bg-teal-50/60 hover:border-teal-700',
      iconBg: 'bg-teal-100 text-teal-700',
      destination: '/reports?tab=gate-pass-closure'
    },
    {
      title: 'Overdue Returns',
      value: summary.overdueReturns || 0,
      icon: AlertTriangle,
      badgeText: 'Critical Attention',
      color: 'border-l-red-600 text-red-700 bg-red-50/60 hover:border-red-700',
      iconBg: 'bg-red-100 text-red-700',
      destination: '/reports?tab=pending-returns&filter=overdue',
      isRisk: true
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-surface-card border border-border-subtle rounded-xl p-4 animate-pulse h-28 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-7 w-7 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-7 bg-slate-200 rounded w-3/4"></div>
            <div className="h-2 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            onClick={() => card.destination && navigate(card.destination)}
            className={`bg-surface-card border border-border-subtle border-l-4 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${card.color}`}
          >
            {/* Header: Title & Icon */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600 line-clamp-1">{card.title}</span>
              <div className={`p-1.5 rounded-lg shrink-0 ${card.iconBg}`}>
                <Icon size={16} />
              </div>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${card.isRisk && card.value > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                <CountUp value={card.value} precision={card.precision || 0} />
              </span>
              {card.suffix && (
                <span className="text-xs font-semibold text-slate-500">{card.suffix}</span>
              )}
            </div>

            {/* Subtext Badge & Navigate Link */}
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-medium text-slate-500 truncate">
                {card.badgeText}
              </span>
              <ArrowUpRight size={12} className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
