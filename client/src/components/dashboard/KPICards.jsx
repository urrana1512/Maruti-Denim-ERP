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
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';

const CountUp = ({ value, precision = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp = null;
    const duration = 500;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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

const KPICards = ({ summary = {}, loading = false, role = 'employee' }) => {
  const navigate = useNavigate();

  // Color-coded left border cards per role with distinct palette swatches
  const employeeCards = [
    {
      title: 'Total Gate Passes',
      context: 'All records this month',
      value: summary.totalGatePasses || 0,
      icon: FileText,
      trend: '+12%',
      isPositive: true,
      borderColor: 'border-l-blue-600',
      iconBg: 'bg-blue-100 text-blue-700',
      destination: '/gate-pass/manage'
    },
    {
      title: 'Pending Gate Passes',
      context: 'Awaiting manager approval',
      value: summary.pendingGatePasses || 0,
      icon: Clock,
      trend: '+5%',
      isPositive: true,
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
      destination: '/gate-pass/manage?status=Pending'
    },
    {
      title: 'Material Currently Out',
      context: 'Returnable field inventory',
      value: summary.materialCurrentlyOut || 0,
      precision: 2,
      suffix: ' Qty',
      icon: PackageCheck,
      trend: '+8%',
      isPositive: true,
      borderColor: 'border-l-purple-600',
      iconBg: 'bg-purple-100 text-purple-700',
      destination: '/reports?tab=returnable-material'
    },
    {
      title: 'Overdue Returns',
      context: 'Exceeded return due date',
      value: summary.overdueReturns || 0,
      icon: AlertTriangle,
      trend: '-2%',
      isPositive: false,
      isRisk: true,
      borderColor: 'border-l-rose-600',
      iconBg: 'bg-rose-100 text-rose-700',
      destination: '/reports?tab=pending-returns&filter=overdue'
    }
  ];

  const adminCards = [
    {
      title: 'Total Gate Passes',
      context: 'Company-wide gate pass volume',
      value: summary.totalGatePasses || 0,
      icon: FileText,
      trend: '+15%',
      isPositive: true,
      borderColor: 'border-l-blue-600',
      iconBg: 'bg-blue-100 text-blue-700',
      destination: '/admin/gate-passes'
    },
    {
      title: 'Pending User Approvals',
      context: 'Staff registration requests',
      value: summary.pendingUserApprovals !== undefined ? summary.pendingUserApprovals : (summary.pendingUserApprovalsCount || 0),
      icon: Clock,
      trend: '+8%',
      isPositive: true,
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
      destination: '/admin/users'
    },
    {
      title: 'Returnable Pending',
      context: 'Active returnable passes',
      value: summary.returnablePending || 0,
      icon: RefreshCw,
      trend: '-4%',
      isPositive: true,
      borderColor: 'border-l-indigo-600',
      iconBg: 'bg-indigo-100 text-indigo-700',
      destination: '/admin/returnable-materials'
    },
    {
      title: 'Closed Gate Passes',
      context: 'Fully completed and archived',
      value: summary.fullyReturnedClosed || 0,
      icon: CheckCheck,
      trend: '+18%',
      isPositive: true,
      borderColor: 'border-l-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-700',
      destination: '/admin/reports'
    }
  ];

  const superAdminCards = [
    {
      title: 'Total Companies',
      context: 'Active group tenants',
      value: summary.totalCompanies || 0,
      icon: FileText,
      trend: '+10%',
      isPositive: true,
      borderColor: 'border-l-sky-600',
      iconBg: 'bg-sky-100 text-sky-700',
      destination: '/superadmin/companies'
    },
    {
      title: 'Total Platform Users',
      context: 'Users across all companies',
      value: summary.totalUsers || 0,
      icon: Clock,
      trend: '+24%',
      isPositive: true,
      borderColor: 'border-l-indigo-600',
      iconBg: 'bg-indigo-100 text-indigo-700',
      destination: '/superadmin/users'
    },
    {
      title: 'Platform Gate Passes',
      context: 'Platform-wide total passes',
      value: summary.totalGatePasses || 0,
      icon: PackageCheck,
      trend: '+19%',
      isPositive: true,
      borderColor: 'border-l-purple-600',
      iconBg: 'bg-purple-100 text-purple-700',
      destination: '/superadmin/gate-passes'
    },
    {
      title: 'Pending Approvals',
      context: 'Cross-tenant pending actions',
      value: summary.pendingGatePasses || 0,
      icon: AlertTriangle,
      trend: '-3%',
      isPositive: true,
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
      destination: '/superadmin/gate-passes?status=Pending'
    }
  ];

  const cards = role === 'superadmin' ? superAdminCards : role === 'admin' ? adminCards : employeeCards;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-[#EBEFF2] rounded-xl p-5 animate-pulse h-36 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            onClick={() => card.destination && navigate(card.destination)}
            className={`bg-white border border-[#EBEFF2] border-l-4 ${card.borderColor} rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between`}
          >
            {/* Top Row: Title & Tinted Icon */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold text-[#111827]">{card.title}</h4>
                <p className="text-[11px] font-medium text-[#6B7280] truncate mt-0.5">{card.context}</p>
              </div>
              <div className={`p-2 rounded-xl shrink-0 ${card.iconBg}`}>
                <Icon size={18} />
              </div>
            </div>

            {/* Metric Value */}
            <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-[#EBEFF2]">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.isRisk && card.value > 0 ? 'text-[#EF4444]' : 'text-[#111827]'}`}>
                  <CountUp value={card.value} precision={card.precision || 0} />
                </span>
                {card.suffix && (
                  <span className="text-xs font-semibold text-[#6B7280]">{card.suffix}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
