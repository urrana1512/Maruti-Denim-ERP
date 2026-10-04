import React from 'react';
import { Check, X } from 'lucide-react';

const PasswordStrengthMeter = ({ password = '' }) => {
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
  let hint = 'Add uppercase letters, numbers, and symbols';

  if (passedCount === 5) {
    strengthLabel = 'Strong & Secure';
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-600';
    hint = 'Password meets enterprise security requirements';
  } else if (passedCount >= 3) {
    strengthLabel = 'Moderate';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-600';
    hint = 'Add special symbols or make it longer';
  } else if (passedCount >= 1) {
    strengthLabel = 'Weak';
    barColor = 'bg-orange-500';
    textColor = 'text-orange-600';
    hint = 'Mix numbers and letters for a stronger password';
  }

  const pct = Math.round((passedCount / 5) * 100);

  return (
    <div className="space-y-2 mt-3 p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs transition-all">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">Password Security:</span>
        <span className={`font-bold ${textColor} transition-colors`}>{strengthLabel}</span>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-500 italic mt-1">{hint}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/60">
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
