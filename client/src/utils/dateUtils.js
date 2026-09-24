import { format } from 'date-fns';

export const safeFormatDate = (dateVal, formatPattern = 'dd/MM/yyyy') => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return format(d, formatPattern);
  } catch (err) {
    return '-';
  }
};
