import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusSquare, ArrowRightLeft, Clock, BarChart3, Database, ShieldCheck } from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add Gate Pass',
      icon: PlusSquare,
      onClick: () => navigate('/gate-pass/add'),
      color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
    },
    {
      label: 'Material Inward',
      icon: ArrowRightLeft,
      onClick: () => navigate('/material-inward'),
      color: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      label: 'Pending Returns',
      icon: Clock,
      onClick: () => navigate('/reports?tab=pending-returns'),
      color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
    },
    {
      label: 'Reports & MIS',
      icon: BarChart3,
      onClick: () => navigate('/reports'),
      color: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      label: 'Master Data',
      icon: Database,
      onClick: () => navigate('/master-data/items'),
      color: 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.99] ${act.color}`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
