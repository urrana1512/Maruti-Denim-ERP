import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import DashboardSection from './DashboardSection';

const DepartmentAnalytics = ({ data = [], loading = false, error = null, onRetry }) => {
  // Spec section 15: If department data doesn't exist in schema/records, hide this section entirely
  if (!loading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <DashboardSection
      title="Department Movement Analytics"
      subtitle="Gate pass distribution across organizational departments"
      icon={PieIcon}
      loading={loading}
      error={error}
      onRetry={onRetry}
      className="mb-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((dept) => (
          <div key={dept.department} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-bold text-slate-800 block truncate">{dept.department}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-bold text-brand-navy">{dept.count} Passes</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {dept.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
};

export default DepartmentAnalytics;
