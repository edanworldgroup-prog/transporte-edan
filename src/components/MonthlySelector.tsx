'use client';

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface MonthlySelectorProps {
  selectedYearMonth: string; // Format: "YYYY-MM" (e.g. "2026-09")
  onChangeMonth: (yearMonth: string) => void;
  isAllTime: boolean;
  onToggleAllTime: (allTime: boolean) => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MonthlySelector: React.FC<MonthlySelectorProps> = ({
  selectedYearMonth,
  onChangeMonth,
  isAllTime,
  onToggleAllTime,
}) => {
  const [yearStr, monthStr] = selectedYearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1 to 12

  const monthName = MESES[month - 1] || '';

  const handlePrevMonth = () => {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const formattedMonth = prevMonth.toString().padStart(2, '0');
    onChangeMonth(`${prevYear}-${formattedMonth}`);
    if (isAllTime) onToggleAllTime(false);
  };

  const handleNextMonth = () => {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const formattedMonth = nextMonth.toString().padStart(2, '0');
    onChangeMonth(`${nextYear}-${formattedMonth}`);
    if (isAllTime) onToggleAllTime(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    onChangeMonth(`${curYear}-${curMonth}`);
    if (isAllTime) onToggleAllTime(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
      
      {/* Label and Info */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Corte Mensual y Contabilidad
          </span>
          <div className="text-sm font-semibold text-white">
            {isAllTime ? 'Histórico General Acumulado' : `Período: ${monthName} ${year}`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        
        {/* Navigation buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-0.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Mes Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-xs font-bold text-slate-200 font-mono select-none min-w-[130px] text-center">
            {monthName.slice(0, 3).toUpperCase()} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Mes Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current month button */}
        <button
          onClick={handleCurrentMonth}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
          title="Ir al mes actual"
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Mes Actual
        </button>

        {/* Toggle All Time vs Month */}
        <button
          onClick={() => onToggleAllTime(!isAllTime)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isAllTime
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isAllTime ? '✓ Todo el Histórico' : 'Ver Todo el Histórico'}
        </button>

      </div>

    </div>
  );
};
