import React, { useRef, useEffect } from 'react';

const OtpInput = ({
  length = 6,
  value = '',
  onChange,
  disabled = false,
  autoFocus = true,
  isError = false,
  isSuccess = false
}) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const digits = value.padEnd(length, '').slice(0, length).split('');

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      // Cleared digit
      const newDigits = [...digits];
      newDigits[idx] = '';
      onChange(newDigits.join(''));
      return;
    }

    // Take last entered character if multiple digits entered in single box
    const singleChar = val.slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = singleChar;
    const nextValue = newDigits.join('');
    onChange(nextValue);

    // Auto advance to next box
    if (idx < length - 1 && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0 && inputsRef.current[idx - 1]) {
        inputsRef.current[idx - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1].focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const targetIdx = Math.min(pastedData.length, length - 1);
      if (inputsRef.current[targetIdx]) {
        inputsRef.current[targetIdx].focus();
      }
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-3 my-5 ${isError ? 'animate-shake' : ''}`}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          value={digits[idx] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border-2 transition-all shadow-sm focus:outline-none ${
            isSuccess
              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400'
              : isError
              ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400'
              : digits[idx]
              ? 'border-brand-navy bg-slate-900 text-white shadow-md scale-[1.02]'
              : 'border-slate-200 bg-white text-slate-900 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20'
          } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
