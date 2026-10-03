import React from 'react';
import { Check, X } from 'lucide-react';

const PasswordStrengthMeter = ({ password }) => {
  const checks = [
    { label: 'At least 10 characters long', valid: password.length >= 10 },
    { label: 'Includes uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Includes lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Includes a number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Includes a special symbol (!@#$%)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
  ];

  const passedCount = checks.filter((c) => c.valid).length;

  let strengthLabel = 'Too Weak';
  let barColor = 'bg-rose-500';
  let textColor = 'text-rose-600';

  if (passedCount === 5) {
    strengthLabel = 'Strong & Secure';
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-600';
  } else if (passedCount >= 3) {
    strengthLabel = 'Moderate';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-600';
  } else if (passedCount >= 1) {
    strengthLabel = 'Weak';
    barColor = 'bg-orange-500';
    textColor = 'text-orange-600';
  }

  const pct = Math.round((passedCount / 5) * 100);

  return (
    <div className="space-y-2 mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-600">Password Strength:</span>
        <span className={`font-bold ${textColor}`}>{strengthLabel}</span>
      </div>

      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {checks.map((chk, idx) => (
          <div key={idx} className="flex items-center text-[11px]">
            {chk.valid ? (
              <Check size={13} className="text-emerald-500 mr-1.5 shrink-0" />
            ) : (
              <X size={13} className="text-slate-300 mr-1.5 shrink-0" />
            )}
            <span className={chk.valid ? 'text-slate-700 font-medium' : 'text-slate-400'}>{chk.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
