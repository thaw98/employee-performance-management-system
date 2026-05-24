import React from 'react';

type MonthYearPickerProps = {
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const padMonth = (month: number) => String(month).padStart(2, '0');

const parseValue = (value: string) => {
  const [yearStr, monthStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || month < 1 || month > 12) {
    return getCurrentYearMonth();
  }
  return { year, month };
};

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  minYear,
  maxYear,
  className = ''
}) => {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const { year: selectedYear, month: selectedMonth } = parseValue(value);
  const startYear = minYear ?? currentYear;
  const endYear = maxYear ?? currentYear + 10;

  const handleYearChange = (yearValue: string) => {
    const nextYear = Number(yearValue);
    const nextMonth = nextYear === currentYear && selectedMonth < currentMonth ? currentMonth : selectedMonth;
    onChange(`${nextYear}-${padMonth(nextMonth)}`);
  };

  const handleMonthChange = (monthValue: string) => {
    const nextMonth = Number(monthValue);
    onChange(`${selectedYear}-${padMonth(nextMonth)}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      >
        {Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index).map((yearOption) => (
          <option key={yearOption} value={yearOption}>
            {yearOption}
          </option>
        ))}
      </select>
      <select
        value={selectedMonth}
        onChange={(e) => handleMonthChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      >
        {monthNames.map((name, index) => {
          const monthIndex = index + 1;
          const disabled = selectedYear === currentYear && monthIndex < currentMonth;
          return (
            <option key={name} value={monthIndex} disabled={disabled}>
              {name}
            </option>
          );
        })}
      </select>
    </div>
  );
};
